-- =============================================================================
-- Krøll Admin CMS — pattern images / tags / section hide — ADDITIVE ONLY
-- Run manually AFTER kroll-schema.sql (+ shopping schema if used).
-- Do NOT auto-run from the app. Does not touch FGTG tables.
-- =============================================================================

alter table public.knitting_patterns
  add column if not exists gallery_image_urls jsonb not null default '[]'::jsonb;

alter table public.knitting_patterns
  add column if not exists tags text[] not null default '{}';

alter table public.knitting_patterns
  add column if not exists rest_yarn_friendly boolean not null default false;

alter table public.pattern_sections
  add column if not exists hidden boolean not null default false;

alter table public.pattern_sections
  add column if not exists default_open boolean not null default false;

comment on column public.knitting_patterns.gallery_image_urls is
  'Extra product image URLs (Storage public URLs). Not binary blobs.';
comment on column public.pattern_sections.hidden is
  'When true, section is hidden from reader until shown again in Admin.';

-- ---------------------------------------------------------------------------
-- Storage bucket: pattern-images (PUBLIC read for catalog covers)
-- Create in Dashboard → Storage → New bucket:
--   Name: pattern-images
--   Public: YES (catalog/product covers)
--   File size limit: ~2MB
--   Allowed MIME: image/jpeg, image/png, image/webp, image/gif
--
-- Or via SQL (requires storage schema privileges):
-- ---------------------------------------------------------------------------
-- insert into storage.buckets (id, name, public)
-- values ('pattern-images', 'pattern-images', true)
-- on conflict (id) do nothing;
--
-- Policies (adjust to your admin check):
-- create policy "kroll_pattern_images_public_read"
--   on storage.objects for select
--   using (bucket_id = 'pattern-images');
--
-- create policy "kroll_pattern_images_admin_write"
--   on storage.objects for insert
--   with check (
--     bucket_id = 'pattern-images'
--     and exists (
--       select 1 from public.profiles p
--       where p.id = auth.uid() and p.is_admin = true
--     )
--   );
--
-- create policy "kroll_pattern_images_admin_update"
--   on storage.objects for update
--   using (
--     bucket_id = 'pattern-images'
--     and exists (
--       select 1 from public.profiles p
--       where p.id = auth.uid() and p.is_admin = true
--     )
--   );
--
-- create policy "kroll_pattern_images_admin_delete"
--   on storage.objects for delete
--   using (
--     bucket_id = 'pattern-images'
--     and exists (
--       select 1 from public.profiles p
--       where p.id = auth.uid() and p.is_admin = true
--     )
--   );
