# Peace & Wilson · Daily Tracking System

Day-by-day habit tracking for **Peace** and **Wilson** — mark today only, week-by-week through year end, shared on **every device**.

Made by [Querido❤️](https://kinyanjuiwilson.vercel.app)

## Shared sync (not per-device)

Without Supabase, data stays in the browser (one device only).

With a **free Supabase** project + Vercel env vars, habits and checkmarks sync for Peace and Wilson on all phones/laptops.

### 1. Create free Supabase

1. [supabase.com](https://supabase.com) → New project  
2. SQL Editor → paste & run `supabase/shared-sync.sql`  
3. Project Settings → API → copy **URL**, **anon key**, **service_role key**

### 2. Add env on Vercel

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (secret) |
| `NEXT_PUBLIC_PEACE_PIN` | `peace` |
| `NEXT_PUBLIC_WILSON_PIN` | `willy1` |
| `NEXT_PUBLIC_CLEAN_PIN` | `willy1` |

Redeploy after saving env vars.

### 3. Login

- **Peace** → PIN `peace`  
- **Wilson** → PIN `willy1`  
- **Clean** (clears all checkmarks everywhere) → confirm with `willy1`

## Local run

```bash
npm install
cp .env.example .env.local   # fill Supabase keys for shared sync
npm run dev
```

Repo: [github.com/Wilson-1907/peace](https://github.com/Wilson-1907/peace)

## Features

- Shared cloud sync (API + Supabase)
- Today’s tracking checklist
- Exact dates, week-by-week through 31 Dec
- Dual panes + live compare
- Clean button gated by `willy1`
- Full-bleed couple photos
