-- Krøll product analytics (admin-only aggregates)
-- Additive only — run manually in Supabase → SQL Editor when ready.
-- Requires public.is_admin() (shared auth / admin bootstrap).
-- Privacy: never store stash contents, private notes, email, passwords, or secrets.
-- Do NOT treat checkout success-page visits as verified purchases.

create table if not exists public.kroll_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  created_at timestamptz not null default now(),
  anonymous_session_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  pattern_id text,
  source text,
  properties jsonb not null default '{}'::jsonb,
  env text not null default 'prod' check (env in ('dev', 'prod')),
  path text,
  from_path text
);

create index if not exists kroll_analytics_events_created_idx
  on public.kroll_analytics_events (created_at desc);

create index if not exists kroll_analytics_events_name_created_idx
  on public.kroll_analytics_events (event_name, created_at desc);

create index if not exists kroll_analytics_events_pattern_idx
  on public.kroll_analytics_events (pattern_id)
  where pattern_id is not null;

create index if not exists kroll_analytics_events_env_created_idx
  on public.kroll_analytics_events (env, created_at desc);

alter table public.kroll_analytics_events enable row level security;

drop policy if exists "kroll_analytics_insert_own_or_anon" on public.kroll_analytics_events;
drop policy if exists "kroll_analytics_select_admin" on public.kroll_analytics_events;
drop policy if exists "kroll_analytics_delete_admin" on public.kroll_analytics_events;

-- Anyone can insert events. If user_id is set, it must match auth.uid().
create policy "kroll_analytics_insert_own_or_anon"
  on public.kroll_analytics_events for insert
  with check (
    char_length(anonymous_session_id) between 8 and 80
    and (
      user_id is null
      or user_id = auth.uid()
    )
  );

-- Only admins can read (aggregates in Admin → Innsikt)
create policy "kroll_analytics_select_admin"
  on public.kroll_analytics_events for select
  using (public.is_admin());

create policy "kroll_analytics_delete_admin"
  on public.kroll_analytics_events for delete
  using (public.is_admin());

-- Overview counts for a period (admin only)
create or replace function public.kroll_analytics_overview(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_env text default null
)
returns table (
  event_name text,
  event_count bigint,
  unique_sessions bigint,
  unique_users bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.event_name,
    count(*)::bigint as event_count,
    count(distinct e.anonymous_session_id)::bigint as unique_sessions,
    count(distinct e.user_id)::bigint as unique_users
  from public.kroll_analytics_events e
  where public.is_admin()
    and (p_from is null or e.created_at >= p_from)
    and (p_to is null or e.created_at < p_to)
    and (p_env is null or e.env = p_env)
  group by e.event_name
  order by event_count desc;
$$;

revoke all on function public.kroll_analytics_overview(timestamptz, timestamptz, text) from public;
grant execute on function public.kroll_analytics_overview(timestamptz, timestamptz, text) to authenticated;

-- Top patterns by views / cart / verified purchase (admin only)
create or replace function public.kroll_analytics_top_patterns(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit integer default 20,
  p_env text default null
)
returns table (
  pattern_id text,
  views bigint,
  cart_adds bigint,
  verified_purchases bigint,
  unique_sessions bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.pattern_id,
    count(*) filter (where e.event_name = 'pattern_viewed')::bigint as views,
    count(*) filter (where e.event_name = 'pattern_added_to_cart')::bigint as cart_adds,
    count(*) filter (where e.event_name = 'payment_completed')::bigint as verified_purchases,
    count(distinct e.anonymous_session_id)::bigint as unique_sessions
  from public.kroll_analytics_events e
  where public.is_admin()
    and e.pattern_id is not null
    and (p_from is null or e.created_at >= p_from)
    and (p_to is null or e.created_at < p_to)
    and (p_env is null or e.env = p_env)
    and e.event_name in (
      'pattern_viewed',
      'pattern_added_to_cart',
      'payment_completed'
    )
  group by e.pattern_id
  order by views desc, cart_adds desc
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

revoke all on function public.kroll_analytics_top_patterns(timestamptz, timestamptz, integer, text) from public;
grant execute on function public.kroll_analytics_top_patterns(timestamptz, timestamptz, integer, text) to authenticated;
