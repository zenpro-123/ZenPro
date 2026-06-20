-- ============================================================================
-- ZenPro Supabase Security & Performance Fix
-- Run in: Supabase Dashboard > SQL Editor
-- Date: 2026-06-20
-- ============================================================================

-- ============================================================================
-- SECURITY FIX 1: Revoke public access to handle_new_user()
-- This is a trigger function (fires on auth.users INSERT), not an RPC endpoint.
-- Revoking EXECUTE from anon/authenticated prevents REST API abuse.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- ============================================================================
-- SECURITY FIX 2: Add RLS policy for cache_entries
-- Only the service_role should read/write cache. This clears the
-- "RLS Enabled No Policy" warning while keeping it locked down.
-- ============================================================================

CREATE POLICY "cache_entries_service_only"
  ON public.cache_entries
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- PERFORMANCE FIX 1: Wrap auth.uid() in (select auth.uid())
-- Without the subselect wrapper, Postgres re-evaluates auth.uid() for every
-- row. Wrapping it makes the planner evaluate it once as an InitPlan.
-- Strategy: DROP + re-CREATE each policy with the optimized form.
-- ============================================================================

-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = (select auth.uid()));

-- user_preferences
DROP POLICY IF EXISTS "user_preferences_all_own" ON public.user_preferences;
CREATE POLICY "user_preferences_all_own" ON public.user_preferences
  FOR ALL USING (user_id = (select auth.uid()));

-- user_interactions
DROP POLICY IF EXISTS "user_interactions_all_own" ON public.user_interactions;
CREATE POLICY "user_interactions_all_own" ON public.user_interactions
  FOR ALL USING (user_id = (select auth.uid()));

-- saved_items
DROP POLICY IF EXISTS "saved_items_all_own" ON public.saved_items;
CREATE POLICY "saved_items_all_own" ON public.saved_items
  FOR ALL USING (user_id = (select auth.uid()));

-- user_missions
DROP POLICY IF EXISTS "user_missions_all_own" ON public.user_missions;
CREATE POLICY "user_missions_all_own" ON public.user_missions
  FOR ALL USING (user_id = (select auth.uid()));

-- intelligence_scores
DROP POLICY IF EXISTS "intelligence_scores_all_own" ON public.intelligence_scores;
CREATE POLICY "intelligence_scores_all_own" ON public.intelligence_scores
  FOR ALL USING (user_id = (select auth.uid()));

-- weekly_reviews
DROP POLICY IF EXISTS "weekly_reviews_all_own" ON public.weekly_reviews;
CREATE POLICY "weekly_reviews_all_own" ON public.weekly_reviews
  FOR ALL USING (user_id = (select auth.uid()));

-- collections
DROP POLICY IF EXISTS "collections_all_own" ON public.collections;
CREATE POLICY "collections_all_own" ON public.collections
  FOR ALL USING (user_id = (select auth.uid()));

-- opportunity_tracker
DROP POLICY IF EXISTS "opportunity_tracker_all_own" ON public.opportunity_tracker;
CREATE POLICY "opportunity_tracker_all_own" ON public.opportunity_tracker
  FOR ALL USING (user_id = (select auth.uid()));

-- notes
DROP POLICY IF EXISTS "notes_all_own" ON public.notes;
CREATE POLICY "notes_all_own" ON public.notes
  FOR ALL USING (user_id = (select auth.uid()));

-- user_events
DROP POLICY IF EXISTS "user_events_insert_own" ON public.user_events;
CREATE POLICY "user_events_insert_own" ON public.user_events
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "user_events_select_own" ON public.user_events;
CREATE POLICY "user_events_select_own" ON public.user_events
  FOR SELECT USING (user_id = (select auth.uid()));

-- content_items (read-only for authenticated — merge duplicate policies)
DROP POLICY IF EXISTS "content_items_read_all" ON public.content_items;
DROP POLICY IF EXISTS "content_items_read_anon" ON public.content_items;
CREATE POLICY "content_items_read" ON public.content_items
  FOR SELECT USING (true);

-- content_snapshots
DROP POLICY IF EXISTS "content_snapshots_read_all" ON public.content_snapshots;
CREATE POLICY "content_snapshots_read_all" ON public.content_snapshots
  FOR SELECT USING (true);

-- market_data
DROP POLICY IF EXISTS "market_data_read_all" ON public.market_data;
CREATE POLICY "market_data_read_all" ON public.market_data
  FOR SELECT USING (true);

-- github_trending
DROP POLICY IF EXISTS "github_trending_read_all" ON public.github_trending;
CREATE POLICY "github_trending_read_all" ON public.github_trending
  FOR SELECT USING (true);

-- tools
DROP POLICY IF EXISTS "tools_read_all" ON public.tools;
CREATE POLICY "tools_read_all" ON public.tools
  FOR SELECT USING (true);

-- ai_signals
DROP POLICY IF EXISTS "ai_signals_read_all" ON public.ai_signals;
CREATE POLICY "ai_signals_read_all" ON public.ai_signals
  FOR SELECT USING (true);

-- ============================================================================
-- PERFORMANCE FIX 2: Index unindexed foreign keys
-- These speed up JOINs and CASCADE deletes.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_content_snapshots_item_id
  ON public.content_snapshots (item_id);

CREATE INDEX IF NOT EXISTS idx_opportunity_tracker_item_id
  ON public.opportunity_tracker (item_id);

CREATE INDEX IF NOT EXISTS idx_saved_items_item_id
  ON public.saved_items (item_id);

CREATE INDEX IF NOT EXISTS idx_user_events_item_id
  ON public.user_events (item_id);

CREATE INDEX IF NOT EXISTS idx_user_interactions_item_id
  ON public.user_interactions (item_id);

-- ============================================================================
-- NOTE: Unused indexes (5) are kept for now — they'll become useful as data
-- grows. If you want to drop them later:
--   DROP INDEX IF EXISTS content_snapshots_date_idx;
--   DROP INDEX IF EXISTS market_data_symbol_idx;
--   DROP INDEX IF EXISTS github_trending_date_idx;
--   DROP INDEX IF EXISTS saved_items_collection_idx;
--   DROP INDEX IF EXISTS notes_content_item_idx;
-- ============================================================================

-- ============================================================================
-- SECURITY FIX 3: Leaked Password Protection
-- This cannot be enabled via SQL. Enable it in:
-- Supabase Dashboard > Authentication > Settings > Password Protection
-- Toggle ON "Leaked password protection"
-- ============================================================================
