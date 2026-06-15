-- ZenPro Phase 2 — Intelligence Layer
-- Run via: supabase db push  (or paste into the Supabase SQL editor)

-- ============================================================================
-- CACHE ENTRIES (free Supabase-backed cache tier)
-- ============================================================================
create table public.cache_entries (
  key text primary key,
  value jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.cache_entries enable row level security;
-- no policies — service role bypasses RLS (same convention as 001's shared tables)

-- ============================================================================
-- DAILY SNAPSHOTS ("Things You Should Know Today" / "What Changed")
-- ============================================================================
create table public.daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null unique,
  top_stories jsonb not null default '[]',
  trends jsonb not null default '[]',
  repositories jsonb not null default '[]',
  opportunities jsonb not null default '[]',
  market_summary jsonb not null default '{}',
  generated_at timestamptz not null default now()
);

alter table public.daily_snapshots enable row level security;
create policy "daily_snapshots_read_all" on public.daily_snapshots
  for select using (true);

-- ============================================================================
-- CONTENT ITEMS — allow anonymous reads
-- content_items is now populated by the snapshot service and the dashboard is
-- auth-optional; the existing policy (001) only covers 'authenticated'.
-- ============================================================================
create policy "content_items_read_anon" on public.content_items
  for select using (auth.role() = 'anon');

-- ============================================================================
-- USER EVENTS — generic analytics/event log (impressions, clicks, dismissals)
-- Complements user_interactions (which is content view/save/share/skip-specific);
-- feeds the recommendation engine and future Intelligence Score / Missions modules.
-- ============================================================================
create table public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null,
  item_id uuid references public.content_items (id) on delete set null,
  properties jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index user_events_user_idx on public.user_events (user_id, created_at desc);
create index user_events_type_idx on public.user_events (event_type, created_at desc);

alter table public.user_events enable row level security;
create policy "user_events_insert_own" on public.user_events
  for insert with check (auth.uid() = user_id);
create policy "user_events_select_own" on public.user_events
  for select using (auth.uid() = user_id);
