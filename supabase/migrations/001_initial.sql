-- ZenPro initial schema
-- Run via: supabase db push  (or paste into the Supabase SQL editor)

-- ============================================================================
-- PROFILES (extends auth.users)
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  avatar_url text,
  onboarding_complete boolean not null default false,
  busy_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================
create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  interests text[] not null default '{}',
  favorite_topics text[] not null default '{}',
  favorite_companies text[] not null default '{}',
  favorite_creators text[] not null default '{}',
  interest_vector jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- CONTENT ITEMS (all aggregated content, all categories)
-- ============================================================================
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  category text not null,
  title text not null,
  summary text,
  url text,
  author text,
  image_url text,
  published_at timestamptz,
  metadata jsonb not null default '{}',
  content_hash text not null unique,
  ai_summary text,
  ai_insights jsonb,
  relevance_score numeric(5, 4),
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index content_items_category_idx on public.content_items (category, published_at desc);
create index content_items_source_idx on public.content_items (source);

-- ============================================================================
-- CONTENT SNAPSHOTS ("What Changed Since Yesterday")
-- ============================================================================
create table public.content_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  category text not null,
  item_id uuid references public.content_items (id) on delete cascade,
  trend_direction text not null check (trend_direction in ('up', 'down', 'stable', 'new')),
  change_description text,
  created_at timestamptz not null default now()
);

create index content_snapshots_date_idx on public.content_snapshots (snapshot_date, category);

-- ============================================================================
-- USER INTERACTIONS (feeds the recommendation engine)
-- ============================================================================
create table public.user_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid references public.content_items (id) on delete cascade,
  action_type text not null check (action_type in ('view', 'save', 'share', 'skip')),
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create index user_interactions_user_idx on public.user_interactions (user_id, created_at desc);

-- ============================================================================
-- SAVED ITEMS (Module 19)
-- ============================================================================
create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.content_items (id) on delete cascade,
  collection text not null default 'default',
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create index saved_items_user_idx on public.saved_items (user_id, collection);

-- ============================================================================
-- DAILY MISSIONS (Module 21)
-- ============================================================================
create table public.user_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mission_date date not null,
  missions jsonb not null,
  completed_missions jsonb not null default '[]',
  xp_earned integer not null default 0,
  streak_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, mission_date)
);

-- ============================================================================
-- INTELLIGENCE SCORES (Module 22)
-- ============================================================================
create table public.intelligence_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  score_date date not null,
  reading_score integer not null default 0,
  learning_score integer not null default 0,
  exploration_score integer not null default 0,
  consistency_score integer not null default 0,
  total_score integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, score_date)
);

-- ============================================================================
-- WEEKLY REVIEWS (Module 23)
-- ============================================================================
create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ============================================================================
-- MARKET DATA (Module 16)
-- ============================================================================
create table public.market_data (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  name text not null,
  asset_type text not null check (asset_type in ('index', 'crypto', 'commodity', 'forex')),
  price numeric(20, 8) not null,
  change_24h numeric(20, 8),
  change_percent numeric(10, 4),
  volume numeric(20, 2),
  market_cap numeric(20, 2),
  recorded_at timestamptz not null
);

create index market_data_symbol_idx on public.market_data (symbol, recorded_at desc);

-- ============================================================================
-- GITHUB TRENDING (Module 12)
-- ============================================================================
create table public.github_trending (
  id uuid primary key default gen_random_uuid(),
  repo_full_name text not null,
  description text,
  stars integer not null default 0,
  stars_today integer not null default 0,
  language text,
  url text not null,
  ai_summary text,
  fetched_date date not null,
  created_at timestamptz not null default now()
);

create index github_trending_date_idx on public.github_trending (fetched_date);

-- ============================================================================
-- TOOL SPOTLIGHT (Module 13)
-- ============================================================================
create table public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text,
  description text,
  category text check (category in ('ai', 'productivity', 'developer')),
  pricing text,
  website text,
  features jsonb not null default '[]',
  use_cases jsonb not null default '[]',
  featured_date date,
  logo_url text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- AI SIGNALS (Module 24)
-- ============================================================================
create table public.ai_signals (
  id uuid primary key default gen_random_uuid(),
  signal_type text check (signal_type in ('tech', 'startup', 'creator', 'github')),
  title text not null,
  prediction text not null,
  confidence_score integer not null check (confidence_score between 0 and 100),
  evidence jsonb not null default '[]',
  rationale text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'wrong')),
  generated_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_interactions enable row level security;
alter table public.saved_items enable row level security;
alter table public.user_missions enable row level security;
alter table public.intelligence_scores enable row level security;
alter table public.weekly_reviews enable row level security;

-- content_items, market_data, github_trending, tools, ai_signals, content_snapshots
-- are shared/global tables populated by cron jobs via the service role and
-- readable by all authenticated users.
alter table public.content_items enable row level security;
alter table public.content_snapshots enable row level security;
alter table public.market_data enable row level security;
alter table public.github_trending enable row level security;
alter table public.tools enable row level security;
alter table public.ai_signals enable row level security;

-- Profiles: users manage their own row.
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- User preferences: owner-only.
create policy "user_preferences_all_own" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- User interactions: owner-only.
create policy "user_interactions_all_own" on public.user_interactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Saved items: owner-only.
create policy "saved_items_all_own" on public.saved_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Missions: owner-only.
create policy "user_missions_all_own" on public.user_missions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Intelligence scores: owner-only.
create policy "intelligence_scores_all_own" on public.intelligence_scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Weekly reviews: owner-only.
create policy "weekly_reviews_all_own" on public.weekly_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Shared content tables: readable by any authenticated user, writes via service role only.
create policy "content_items_read_all" on public.content_items
  for select using (auth.role() = 'authenticated');
create policy "content_snapshots_read_all" on public.content_snapshots
  for select using (auth.role() = 'authenticated');
create policy "market_data_read_all" on public.market_data
  for select using (auth.role() = 'authenticated');
create policy "github_trending_read_all" on public.github_trending
  for select using (auth.role() = 'authenticated');
create policy "tools_read_all" on public.tools
  for select using (auth.role() = 'authenticated');
create policy "ai_signals_read_all" on public.ai_signals
  for select using (auth.role() = 'authenticated');
