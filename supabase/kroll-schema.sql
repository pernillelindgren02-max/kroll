-- =============================================================================
-- Krøll — safe ADDITIVE schema for an EXISTING Supabase project
-- =============================================================================
-- Shared with Fra gryte til gaffel:
--   auth.users, public.profiles, public.is_admin()
--
-- This file creates ONLY Krøll tables + RLS + indexes + seed catalog rows.
-- It does NOT:
--   - drop or alter FGTG tables (favorites, recipes, tips, …)
--   - recreate or replace public.profiles
--   - modify public.is_admin() / handle_new_user()
--   - grant anyone admin
--
-- Prerequisites (already used by FGTG):
--   1. supabase/admin-bootstrap.sql  → profiles + is_admin()
--   2. (optional) i18n-bilingual.sql → profiles.preferred_locale
--
-- Run manually in Supabase → SQL Editor when ready.
-- Do NOT auto-run from the app.
-- =============================================================================

-- Guard: refuse to proceed without shared profiles / is_admin()
do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception
      'public.profiles missing. Run FGTG admin-bootstrap.sql first, then re-run this file.';
  end if;
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'
  ) then
    raise exception
      'public.is_admin() missing. Run FGTG admin-bootstrap.sql first, then re-run this file.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Catalog: knitting_patterns
-- ---------------------------------------------------------------------------
create table if not exists public.knitting_patterns (
  id text primary key,
  slug text unique not null,
  status text not null check (status in ('draft', 'published')),
  demo_pattern boolean not null default false,
  price_nok integer not null default 0,
  cover_image_url text,
  pdf_url text,
  title_no text not null,
  title_en text not null,
  tagline_no text not null default '',
  tagline_en text not null default '',
  description_no text not null default '',
  description_en text not null default '',
  designer text not null default '',
  difficulty text not null,
  categories text[] not null default '{}',
  sizes jsonb not null default '[]'::jsonb,
  yarn_requirements jsonb not null default '[]'::jsonb,
  needles jsonb not null default '[]'::jsonb,
  recommended_ease_min_cm numeric,
  recommended_ease_max_cm numeric,
  needle_mm numeric[] not null default '{}',
  gauge_stitches numeric,
  gauge_rows numeric,
  gauge_per_cm numeric,
  techniques jsonb not null default '[]'::jsonb,
  abbreviations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing projects: add columns if table already existed without them
alter table public.knitting_patterns
  add column if not exists demo_pattern boolean not null default false;
alter table public.knitting_patterns
  add column if not exists needles jsonb not null default '[]'::jsonb;
alter table public.knitting_patterns
  add column if not exists recommended_ease_min_cm numeric;
alter table public.knitting_patterns
  add column if not exists recommended_ease_max_cm numeric;

create index if not exists knitting_patterns_status_idx
  on public.knitting_patterns (status);
create index if not exists knitting_patterns_slug_idx
  on public.knitting_patterns (slug);

-- ---------------------------------------------------------------------------
-- pattern_sections
-- ---------------------------------------------------------------------------
create table if not exists public.pattern_sections (
  id text primary key,
  pattern_id text not null references public.knitting_patterns (id) on delete cascade,
  kind text not null,
  sort_order integer not null default 0,
  title_no text not null,
  title_en text not null,
  body_no text not null default '',
  body_en text not null default '',
  image_url text,
  row_count integer
);

create index if not exists pattern_sections_pattern_id_idx
  on public.pattern_sections (pattern_id, sort_order);

-- ---------------------------------------------------------------------------
-- Yarn catalog
-- ---------------------------------------------------------------------------
create table if not exists public.yarns (
  id text primary key,
  brand text not null,
  name_no text not null,
  name_en text not null,
  weight text not null,
  metres_per_skein numeric not null,
  grams_per_skein numeric not null,
  fibre_no text not null default '',
  fibre_en text not null default '',
  suggested_needle_mm numeric[] not null default '{}',
  gauge_stitches numeric,
  gauge_rows numeric,
  gauge_per_cm numeric,
  colourways jsonb not null default '[]'::jsonb
);

create index if not exists yarns_brand_idx on public.yarns (brand);

-- ---------------------------------------------------------------------------
-- User library / progress / stash / projects  (FK → auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.pattern_ownership (
  user_id uuid not null references auth.users (id) on delete cascade,
  pattern_id text not null references public.knitting_patterns (id) on delete cascade,
  purchased_at timestamptz not null default now(),
  purchase_kind text not null default 'mock',
  price_paid_nok integer not null default 0,
  provider text,
  provider_ref text,
  primary key (user_id, pattern_id)
);

create index if not exists pattern_ownership_user_idx
  on public.pattern_ownership (user_id);

create table if not exists public.pattern_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  pattern_id text not null references public.knitting_patterns (id) on delete cascade,
  section_id text,
  row_number integer,
  step_index integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, pattern_id)
);

create index if not exists pattern_progress_user_idx
  on public.pattern_progress (user_id);

create table if not exists public.user_yarn_stash (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  yarn_id text references public.yarns (id) on delete set null,
  custom_brand text,
  custom_name text,
  weight text,
  fibre text,
  colour_name text,
  colour_hex text,
  quantity numeric not null,
  unit text not null check (unit in ('skeins', 'g', 'm')),
  metres_total numeric,
  grams_total numeric,
  needle_mm numeric,
  gauge_stitches numeric,
  gauge_rows numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_yarn_stash_user_idx
  on public.user_yarn_stash (user_id);

create table if not exists public.knitting_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pattern_id text not null references public.knitting_patterns (id) on delete restrict,
  title text not null,
  size_id text,
  stash_item_ids uuid[] not null default '{}',
  status text not null check (status in ('planned', 'in_progress', 'finished')),
  notes text not null default '',
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knitting_projects_user_idx
  on public.knitting_projects (user_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.knitting_patterns enable row level security;
alter table public.pattern_sections enable row level security;
alter table public.yarns enable row level security;
alter table public.pattern_ownership enable row level security;
alter table public.pattern_progress enable row level security;
alter table public.user_yarn_stash enable row level security;
alter table public.knitting_projects enable row level security;

-- knitting_patterns: public read published; admin full manage
drop policy if exists "kroll_patterns_select_published" on public.knitting_patterns;
drop policy if exists "kroll_patterns_select_admin" on public.knitting_patterns;
drop policy if exists "kroll_patterns_insert_admin" on public.knitting_patterns;
drop policy if exists "kroll_patterns_update_admin" on public.knitting_patterns;
drop policy if exists "kroll_patterns_delete_admin" on public.knitting_patterns;

create policy "kroll_patterns_select_published"
  on public.knitting_patterns for select
  using (status = 'published' or public.is_admin());

create policy "kroll_patterns_insert_admin"
  on public.knitting_patterns for insert
  with check (public.is_admin());

create policy "kroll_patterns_update_admin"
  on public.knitting_patterns for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "kroll_patterns_delete_admin"
  on public.knitting_patterns for delete
  using (public.is_admin());

-- pattern_sections: readable when parent pattern is; admin manage
drop policy if exists "kroll_sections_select" on public.pattern_sections;
drop policy if exists "kroll_sections_insert_admin" on public.pattern_sections;
drop policy if exists "kroll_sections_update_admin" on public.pattern_sections;
drop policy if exists "kroll_sections_delete_admin" on public.pattern_sections;

create policy "kroll_sections_select"
  on public.pattern_sections for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.knitting_patterns p
      where p.id = pattern_id and p.status = 'published'
    )
    or exists (
      select 1 from public.pattern_ownership o
      where o.pattern_id = pattern_sections.pattern_id
        and o.user_id = auth.uid()
    )
  );

create policy "kroll_sections_insert_admin"
  on public.pattern_sections for insert
  with check (public.is_admin());

create policy "kroll_sections_update_admin"
  on public.pattern_sections for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "kroll_sections_delete_admin"
  on public.pattern_sections for delete
  using (public.is_admin());

-- yarns: public read catalog; admin manage
drop policy if exists "kroll_yarns_select" on public.yarns;
drop policy if exists "kroll_yarns_insert_admin" on public.yarns;
drop policy if exists "kroll_yarns_update_admin" on public.yarns;
drop policy if exists "kroll_yarns_delete_admin" on public.yarns;

create policy "kroll_yarns_select"
  on public.yarns for select
  using (true);

create policy "kroll_yarns_insert_admin"
  on public.yarns for insert
  with check (public.is_admin());

create policy "kroll_yarns_update_admin"
  on public.yarns for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "kroll_yarns_delete_admin"
  on public.yarns for delete
  using (public.is_admin());

-- pattern_ownership: own-user R/W (mock purchase inserts own row)
drop policy if exists "kroll_ownership_select_own" on public.pattern_ownership;
drop policy if exists "kroll_ownership_insert_own" on public.pattern_ownership;
drop policy if exists "kroll_ownership_update_own" on public.pattern_ownership;
drop policy if exists "kroll_ownership_delete_own" on public.pattern_ownership;

create policy "kroll_ownership_select_own"
  on public.pattern_ownership for select
  using (auth.uid() = user_id);

create policy "kroll_ownership_insert_own"
  on public.pattern_ownership for insert
  with check (auth.uid() = user_id);

create policy "kroll_ownership_update_own"
  on public.pattern_ownership for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "kroll_ownership_delete_own"
  on public.pattern_ownership for delete
  using (auth.uid() = user_id);

-- pattern_progress: own-user R/W
drop policy if exists "kroll_progress_select_own" on public.pattern_progress;
drop policy if exists "kroll_progress_insert_own" on public.pattern_progress;
drop policy if exists "kroll_progress_update_own" on public.pattern_progress;
drop policy if exists "kroll_progress_delete_own" on public.pattern_progress;

create policy "kroll_progress_select_own"
  on public.pattern_progress for select
  using (auth.uid() = user_id);

create policy "kroll_progress_insert_own"
  on public.pattern_progress for insert
  with check (auth.uid() = user_id);

create policy "kroll_progress_update_own"
  on public.pattern_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "kroll_progress_delete_own"
  on public.pattern_progress for delete
  using (auth.uid() = user_id);

-- user_yarn_stash: own-user R/W
drop policy if exists "kroll_stash_select_own" on public.user_yarn_stash;
drop policy if exists "kroll_stash_insert_own" on public.user_yarn_stash;
drop policy if exists "kroll_stash_update_own" on public.user_yarn_stash;
drop policy if exists "kroll_stash_delete_own" on public.user_yarn_stash;

create policy "kroll_stash_select_own"
  on public.user_yarn_stash for select
  using (auth.uid() = user_id);

create policy "kroll_stash_insert_own"
  on public.user_yarn_stash for insert
  with check (auth.uid() = user_id);

create policy "kroll_stash_update_own"
  on public.user_yarn_stash for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "kroll_stash_delete_own"
  on public.user_yarn_stash for delete
  using (auth.uid() = user_id);

-- knitting_projects: own-user R/W
drop policy if exists "kroll_projects_select_own" on public.knitting_projects;
drop policy if exists "kroll_projects_insert_own" on public.knitting_projects;
drop policy if exists "kroll_projects_update_own" on public.knitting_projects;
drop policy if exists "kroll_projects_delete_own" on public.knitting_projects;

create policy "kroll_projects_select_own"
  on public.knitting_projects for select
  using (auth.uid() = user_id);

create policy "kroll_projects_insert_own"
  on public.knitting_projects for insert
  with check (auth.uid() = user_id);

create policy "kroll_projects_update_own"
  on public.knitting_projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "kroll_projects_delete_own"
  on public.knitting_projects for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed catalog (idempotent) — needed so ownership FK works after mock buy
-- ---------------------------------------------------------------------------
insert into public.yarns (
  id, brand, name_no, name_en, weight, metres_per_skein, grams_per_skein,
  fibre_no, fibre_en, suggested_needle_mm, gauge_stitches, gauge_rows, gauge_per_cm, colourways
) values
  (
    'yarn-sandnes-peer-gypt', 'Sandnes Garn', 'Peer Gynt', 'Peer Gynt', 'worsted',
    91, 50, '100 % ull', '100% wool', array[3.5, 4]::numeric[], 22, 30, 10,
    '[{"id":"cw-pg-2523","name":{"no":"Naturmelert","en":"Natural heather"},"hex":"#d9cfc0"}]'::jsonb
  ),
  (
    'yarn-dale-babyull', 'Dale Garn', 'Baby Ull', 'Baby Wool', 'fingering',
    175, 50, '100 % merinoull', '100% merino wool', array[2.5, 3]::numeric[], 28, 36, 10,
    '[]'::jsonb
  ),
  (
    'yarn-rauma-finull', 'Rauma', 'Finull', 'Finull', 'sport',
    175, 50, '100 % norsk ull', '100% Norwegian wool', array[3]::numeric[], 26, 34, 10,
    '[]'::jsonb
  ),
  (
    'yarn-drops-air', 'DROPS', 'Air', 'Air', 'worsted',
    150, 50, '65 % alpaca, 28 % polyamid, 7 % ull',
    '65% alpaca, 28% polyamide, 7% wool', array[5]::numeric[], 17, 22, 10,
    '[]'::jsonb
  )
on conflict (id) do nothing;

-- Pattern + section catalog: run kroll-demo-seed.sql next
-- (nine complete demo patterns with demo_pattern = true, price 0).

-- Done. profiles / FGTG tables untouched.
comment on table public.knitting_patterns is 'Krøll-only catalog; shared Auth via auth.users + profiles';
comment on column public.knitting_patterns.demo_pattern is 'Internal demo flag — never sell as final paid production';
comment on table public.pattern_ownership is 'Krøll-only; mock purchase rows until real payment provider';
