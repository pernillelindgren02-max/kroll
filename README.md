# Krøll

Standalone knitting app (NO/EN). **Separate** from *Fra gryte til gaffel* — own `package.json`, own frontend, own future GitHub repo.

Brand name is **Krøll** in both languages.

## What this is

Mobile-first knitting product with four pillars:

1. Original patterns sold in-app (mock purchase in v1)
2. Personal library of owned patterns
3. Progress tracking inside each pattern
4. Yarn stash that suggests makeable patterns

## This folder vs Fra gryte til gaffel

| | Krøll | Fra gryte til gaffel |
|---|---|---|
| Path | `kroll/` (this app) | workspace root |
| Domain | Knitting patterns | Recipes |
| Repo (today) | Lives as a subfolder until split | This GitHub repo |
| Repo (later) | Own GitHub repository | Unchanged |

**Do not merge the frontends.** Patterns were adapted from the recipe app (Vite/React, Supabase client shape, auth, bilingual i18n, admin gate) but the brand, routes, and data model are Krøll-only.

## Run locally

```bash
cd kroll
npm install
cp .env.example .env.local
npm run dev
```

Open [http://127.0.0.1:4318](http://127.0.0.1:4318) (port **4318**, not 4317).

Without Supabase keys the app runs with local demo data. On Account, use **Continue as local user (demo)** for ownership/stash/projects and DEV admin.

## Supabase (shared Auth + profiles with FGTG)

Use the **same** project URL and publishable key as Fra gryte til gaffel in `kroll/.env.local`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Then run **once** (manually in SQL Editor — the app never runs SQL):

1. `supabase/kroll-schema.sql` — tables + RLS + yarn catalog  
2. `supabase/kroll-demo-seed.sql` — nine demo patterns (`demo_pattern = true`), **INSERT … ON CONFLICT DO NOTHING** (safe if Admin already edited production rows)

**CMS data safety:** Once patterns exist in Supabase, that DB (+ Storage for images/PDFs) is the source of truth. Frontend deploys never rewrite catalog content. Hard-coded demos only fill missing ids locally — they do not overwrite Supabase rows. Do not re-run destructive seed scripts against production.

- **Shared:** `auth.users` + `public.profiles` + `public.is_admin()` (FGTG bootstrap). Same email/password works in both apps.
- **Krøll-only:** `knitting_patterns`, `pattern_sections`, `pattern_ownership`, `pattern_progress`, `yarns`, `user_yarn_stash`, `knitting_projects`
- **FGTG tables:** untouched

Signed-in users persist purchases, progress, stash, and projects to Supabase. Anonymous users stay on localStorage. On sign-in, guest local data is **merged** into the account (never silently deleted). Admin pattern CMS saves go to Supabase when configured.

Auth storage key is `kroll-auth` so local dual-dev on one origin does not collide with FGTG’s session key.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on :4318 |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | Oxlint |

## Future split to own repo

This folder is self-contained (`README`, `.gitignore`, `.env.example`, `package.json`). To extract:

1. Create a new empty GitHub repo
2. Copy `kroll/` contents to the new repo root
3. Push from there — no need to rewrite app code

Until then, treat `kroll/` as the app root and ignore the parent recipe app when developing Krøll.

## v1 notes

- Purchases are **mock only** (obvious demo banner; no card fields)
- PDF: URL field in Admin + placeholder download; no email delivery
- Matching explains metres / grams / weight / gauge / needle; soft matches when data is incomplete
