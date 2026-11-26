-- ============================================================
-- Peace & Wilson Habit Tracker — Supabase DDL + RLS
-- Run this in the Supabase SQL Editor (or via CLI migration).
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PROFILES (1:1 with auth.users)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  partner_id uuid references public.profiles (id) on delete set null,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- HABITS
-- assigned_to: who should track this habit visually
--   'me'      → only creator's grid
--   'partner' → only partner's grid (creator still owns the row)
--   'both'    → appears on both grids; each user completes separately
-- ------------------------------------------------------------
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  assigned_to text not null default 'me'
    check (assigned_to in ('me', 'partner', 'both')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists habits_user_id_idx on public.habits (user_id);
create index if not exists habits_active_idx on public.habits (user_id, is_active);

-- ------------------------------------------------------------
-- COMPLETIONS
-- Each user owns their own completion rows (even for shared habits).
-- Historical rows are never deleted when a habit is archived.
-- ------------------------------------------------------------
create table if not exists public.completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, user_id, date)
);

create index if not exists completions_user_date_idx
  on public.completions (user_id, date);
create index if not exists completions_habit_idx
  on public.completions (habit_id);

-- ------------------------------------------------------------
-- Helper: am I the owner OR the linked partner?
-- ------------------------------------------------------------
create or replace function public.is_self_or_partner(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.partner_id = target
    )
    or exists (
      select 1 from public.profiles p
      where p.id = target
        and p.partner_id = auth.uid()
    );
$$;

-- ------------------------------------------------------------
-- Auto-create profile on signup
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- updated_at triggers
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists habits_updated_at on public.habits;
create trigger habits_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

drop trigger if exists completions_updated_at on public.completions;
create trigger completions_updated_at
  before update on public.completions
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Rule of thumb:
--   READ  → self OR partner
--   WRITE → self only (never edit partner records)
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.completions enable row level security;

-- PROFILES
drop policy if exists "profiles_select_self_or_partner" on public.profiles;
create policy "profiles_select_self_or_partner"
  on public.profiles for select
  using (public.is_self_or_partner(id));

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (id = auth.uid());

-- HABITS
drop policy if exists "habits_select_self_or_partner" on public.habits;
create policy "habits_select_self_or_partner"
  on public.habits for select
  using (public.is_self_or_partner(user_id));

drop policy if exists "habits_insert_own" on public.habits;
create policy "habits_insert_own"
  on public.habits for insert
  with check (user_id = auth.uid());

drop policy if exists "habits_update_own" on public.habits;
create policy "habits_update_own"
  on public.habits for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_delete_own"
  on public.habits for delete
  using (user_id = auth.uid());

-- COMPLETIONS
-- Partner can READ your checkmarks; only you can toggle them.
drop policy if exists "completions_select_self_or_partner" on public.completions;
create policy "completions_select_self_or_partner"
  on public.completions for select
  using (public.is_self_or_partner(user_id));

drop policy if exists "completions_insert_own" on public.completions;
create policy "completions_insert_own"
  on public.completions for insert
  with check (user_id = auth.uid());

drop policy if exists "completions_update_own" on public.completions;
create policy "completions_update_own"
  on public.completions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "completions_delete_own" on public.completions;
create policy "completions_delete_own"
  on public.completions for delete
  using (user_id = auth.uid());

-- ------------------------------------------------------------
-- Realtime (optional — enable in Dashboard → Replication too)
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.habits;
alter publication supabase_realtime add table public.completions;

-- ------------------------------------------------------------
-- Seed helper: link Peace ↔ Wilson as partners after both sign up
-- Replace the UUIDs with real auth.users ids.
-- ------------------------------------------------------------
-- update public.profiles set partner_id = '<wilson-uuid>' where id = '<peace-uuid>';
-- update public.profiles set partner_id = '<peace-uuid>' where id = '<wilson-uuid>';
