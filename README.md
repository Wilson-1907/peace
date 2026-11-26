# Peace & Wilson · Habit Tracker

Dual-pane habit tracker for **Peace** and **Wilson** — shared visibility, strict write isolation, full-bleed couple photos, Made by [Querido❤️](https://kinyanjuiwilson.vercel.app).

## Can Vercel host this for free?

**Yes.** Default mode is **full frontend** (no paid backend):

| Piece | Free option |
|-------|-------------|
| Hosting | **Vercel Hobby** (Next.js) |
| Login | Small **PIN** per person (`peace` / `wilson`) |
| Data | **localStorage** on each device |
| Photos / UI | Static files in `/public` |

Optional later: add a free **Supabase** project for live sync across phones. Until then, no backend keys are required.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login)

- Sign in as **Peace** with PIN `peace`
- Sign in as **Wilson** with PIN `wilson`

Change PINs via `.env.local` (see `.env.example`).

## Deploy on Vercel (free)

```bash
npx vercel
```

Set optional env vars in the Vercel project:

- `NEXT_PUBLIC_PEACE_PIN`
- `NEXT_PUBLIC_WILSON_PIN`

## Features

- Full-page couple photo backdrop (not hero-only)
- Dual grids + live compare strip
- Habit manager (Me / Partner / Both)
- Scoring + remarks engines
- Partner grids are view-only

## Optional Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migration.sql`
3. Add `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Link Peace ↔ Wilson as partners (SQL comments in the migration)
