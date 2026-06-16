-- ZenPro Phase 3 schema
-- Run via: supabase db push  (or paste into the Supabase SQL editor)
--
-- Adds Collections (Saved Items Hub), the polymorphic Knowledge Notes table, and
-- the Opportunity Tracker table. The latter two are introduced together because
-- `notes.opportunity_id` references `opportunity_tracker(id)`. Only Collections
-- and content-item-targeted Notes have UI/API in Phase 3a; Opportunity Tracker and
-- opportunity-targeted Notes are schema-only until Phase 3b.

-- ============================================================================
-- COLLECTIONS
-- ============================================================================
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index collections_user_idx on public.collections (user_id);

-- ============================================================================
-- SAVED ITEMS — replace free-text `collection` + single `notes` field with a
-- collection_id FK (Knowledge Notes below replaces the old `notes` column).
-- `saved_items` currently has zero rows, so this drop/replace is safe.
-- ============================================================================
drop index if exists public.saved_items_user_idx;

alter table public.saved_items drop column collection;
alter table public.saved_items drop column notes;
alter table public.saved_items
  add column collection_id uuid references public.collections (id) on delete set null;

create index saved_items_user_idx on public.saved_items (user_id, created_at desc);
create index saved_items_collection_idx on public.saved_items (collection_id);

-- ============================================================================
-- OPPORTUNITY TRACKER (schema only — Phase 3b builds UI/API)
-- ============================================================================
create table public.opportunity_tracker (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid references public.content_items (id) on delete set null,
  title text not null,
  company text,
  url text,
  opportunity_type text,
  status text not null default 'interested'
    check (status in ('interested', 'applied', 'interviewing', 'rejected', 'offer', 'archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index opportunity_tracker_user_idx on public.opportunity_tracker (user_id, status);

-- ============================================================================
-- NOTES — polymorphic (content_item OR opportunity), Phase 3a uses content_item only
-- ============================================================================
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_item_id uuid references public.content_items (id) on delete cascade,
  opportunity_id uuid references public.opportunity_tracker (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_exactly_one_target check (
    (content_item_id is not null and opportunity_id is null)
    or (content_item_id is null and opportunity_id is not null)
  )
);

create index notes_user_idx on public.notes (user_id, created_at desc);
create index notes_content_item_idx on public.notes (content_item_id);
create index notes_opportunity_idx on public.notes (opportunity_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.collections enable row level security;
alter table public.opportunity_tracker enable row level security;
alter table public.notes enable row level security;

create policy "collections_all_own" on public.collections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "opportunity_tracker_all_own" on public.opportunity_tracker
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notes_all_own" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- `saved_items_all_own` (from 001_initial.sql) already covers the new
-- collection_id column — no policy change needed.
