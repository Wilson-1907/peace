-- ============================================================
-- Peace & Wilson — SHARED sync (all devices / phones)
-- Run in Supabase → SQL Editor (free project).
-- Writes go through Vercel API (service role).
-- Reads are open so Realtime can refresh every device.
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.shared_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  assigned_to text not null default 'me'
    check (assigned_to in ('me', 'partner', 'both')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists shared_habits_user_idx
  on public.shared_habits (user_id, is_active, sort_order);

create table if not exists public.shared_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.shared_habits (id) on delete cascade,
  user_id uuid not null,
  date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (habit_id, user_id, date)
);

create index if not exists shared_completions_user_date_idx
  on public.shared_completions (user_id, date);

alter table public.shared_habits enable row level security;
alter table public.shared_completions enable row level security;

drop policy if exists "shared_habits_select_all" on public.shared_habits;
create policy "shared_habits_select_all"
  on public.shared_habits for select
  using (true);

drop policy if exists "shared_completions_select_all" on public.shared_completions;
create policy "shared_completions_select_all"
  on public.shared_completions for select
  using (true);

-- Writes via publishable key (API routes). Optional: set SUPABASE_SERVICE_ROLE_KEY later.
grant select, insert, update, delete on public.shared_habits to anon, authenticated, service_role;
grant select, insert, update, delete on public.shared_completions to anon, authenticated, service_role;

drop policy if exists "shared_habits_insert" on public.shared_habits;
create policy "shared_habits_insert"
  on public.shared_habits for insert to anon, authenticated with check (true);
drop policy if exists "shared_habits_update" on public.shared_habits;
create policy "shared_habits_update"
  on public.shared_habits for update to anon, authenticated using (true) with check (true);
drop policy if exists "shared_habits_delete" on public.shared_habits;
create policy "shared_habits_delete"
  on public.shared_habits for delete to anon, authenticated using (true);

drop policy if exists "shared_completions_insert" on public.shared_completions;
create policy "shared_completions_insert"
  on public.shared_completions for insert to anon, authenticated with check (true);
drop policy if exists "shared_completions_update" on public.shared_completions;
create policy "shared_completions_update"
  on public.shared_completions for update to anon, authenticated using (true) with check (true);
drop policy if exists "shared_completions_delete" on public.shared_completions;
create policy "shared_completions_delete"
  on public.shared_completions for delete to anon, authenticated using (true);

-- Realtime (also toggle in Dashboard → Database → Replication if needed)
do $$
begin
  alter publication supabase_realtime add table public.shared_habits;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.shared_completions;
exception when duplicate_object then null;
end $$;
