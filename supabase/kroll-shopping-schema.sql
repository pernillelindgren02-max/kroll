-- =============================================================================
-- Krøll shopping / purchase / PDF security — ADDITIVE ONLY
-- Run manually AFTER kroll-schema.sql (do not auto-run from the app).
-- Does not touch FGTG tables. Preserves existing Krøll catalog/ownership data.
-- =============================================================================

-- Private PDF object path (bucket: pattern-pdfs). Public pdf_url must not be
-- used for paid patterns; prefer signed URLs via Edge Function create-pdf-url.
alter table public.knitting_patterns
  add column if not exists pdf_storage_path text;

comment on column public.knitting_patterns.pdf_storage_path is
  'Private Storage path in bucket pattern-pdfs. Access only via signed URL after ownership check.';

-- ---------------------------------------------------------------------------
-- Purchases (Stripe-verified). Frontend never writes status=paid.
-- ---------------------------------------------------------------------------
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('pending', 'paid', 'failed', 'refunded')),
  currency text not null default 'nok',
  amount_total_nok integer not null default 0,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  email_sent_at timestamptz
);

create index if not exists purchases_user_idx on public.purchases (user_id);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  pattern_id text not null references public.knitting_patterns (id) on delete restrict,
  unit_price_nok integer not null,
  unique (purchase_id, pattern_id)
);

create index if not exists purchase_items_pattern_idx
  on public.purchase_items (pattern_id);

-- Link ownership rows to a verified purchase when applicable
alter table public.pattern_ownership
  add column if not exists purchase_id uuid references public.purchases (id) on delete set null;

-- Allow verified purchase kinds (keeps existing 'mock' rows valid)
-- purchase_kind remains free text; app uses: demo_claim | stripe | admin_grant | mock

alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;

-- Buyers can read their own purchases; inserts/updates only via service role (webhook)
drop policy if exists "kroll_purchases_select_own" on public.purchases;
create policy "kroll_purchases_select_own"
  on public.purchases for select
  using (auth.uid() = user_id);

drop policy if exists "kroll_purchase_items_select_own" on public.purchase_items;
create policy "kroll_purchase_items_select_own"
  on public.purchase_items for select
  using (
    exists (
      select 1 from public.purchases p
      where p.id = purchase_id and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage bucket (create in Dashboard if missing): pattern-pdfs — PRIVATE
-- Policies: no public read. Signed URLs issued only after ownership check
-- in Edge Function create-pdf-url (service role or storage.createSignedUrl).
-- ---------------------------------------------------------------------------

-- Production hardening (optional; apply when Stripe goes live):
--   drop policy "kroll_ownership_insert_own" on public.pattern_ownership;
--   -- then only service role / admin_grant path inserts ownership for paid patterns.
-- Keep client insert temporarily for demo_claim local testing, or replace with
-- an RPC that only allows demo_pattern / price_nok = 0.

comment on table public.purchases is
  'Krøll Stripe purchases. status=paid only after verified webhook.';
comment on table public.purchase_items is
  'Line items for a Krøll purchase; prices snapshotted at checkout creation.';
