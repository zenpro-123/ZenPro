import { withCache, CACHE_TTL } from "@/lib/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodaySnapshot } from "@/lib/intelligence/snapshot-service";
import type {
  DailySnapshot,
  SnapshotOpportunity,
  SnapshotRepo,
  SnapshotTrend,
  WeeklyReview,
} from "@/types/intelligence";
import type { TopDevelopment, DevelopmentImpact } from "@/types/ai";
import type { MarketItem, MarketInsight } from "@/types/market";

interface DailySnapshotRow {
  snapshot_date: string;
  top_stories: TopDevelopment[];
  trends: SnapshotTrend[];
  repositories: SnapshotRepo[];
  opportunities: SnapshotOpportunity[];
  market_summary: { items: MarketItem[]; insight: MarketInsight };
  generated_at: string;
}

const IMPACT_RANK: Record<DevelopmentImpact, number> = { high: 3, medium: 2, low: 1 };

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function dateNDaysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Loads the last 7 days of snapshots (most recent first), falling back to lazily
 *  generating today's if the table is empty so the review always has real data. */
async function loadRecentSnapshots(): Promise<DailySnapshot[]> {
  const weekStart = dateNDaysAgo(6);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("daily_snapshots")
      .select("*")
      .gte("snapshot_date", weekStart)
      .order("snapshot_date", { ascending: false });

    if (!error && data && data.length > 0) {
      return (data as DailySnapshotRow[]).map((row) => ({
        date: row.snapshot_date,
        topStories: row.top_stories,
        trends: row.trends,
        repositories: row.repositories,
        opportunities: row.opportunities,
        marketSummary: row.market_summary,
        generatedAt: row.generated_at,
      }));
    }
  } catch {
    // fall through to lazy generation
  }

  const { data: today } = await getOrCreateTodaySnapshot();
  return [today];
}

/** Rank clustered stories across the week by impact, then by how many days covered them. */
function aggregateBiggestStories(snapshots: DailySnapshot[]): TopDevelopment[] {
  const byTitle = new Map<string, { story: TopDevelopment; mentions: number }>();

  for (const snapshot of snapshots) {
    for (const story of snapshot.topStories ?? []) {
      const key = normalizeTitle(story.title);
      const existing = byTitle.get(key);
      if (existing) {
        existing.mentions += 1;
        if (IMPACT_RANK[story.impact] > IMPACT_RANK[existing.story.impact]) existing.story = story;
      } else {
        byTitle.set(key, { story, mentions: 1 });
      }
    }
  }

  return Array.from(byTitle.values())
    .sort(
      (a, b) =>
        IMPACT_RANK[b.story.impact] - IMPACT_RANK[a.story.impact] || b.mentions - a.mentions
    )
    .slice(0, 6)
    .map((entry) => entry.story);
}

/** Dedupe repos by full name across the week, keeping the highest daily-velocity sighting. */
function aggregateTopRepositories(snapshots: DailySnapshot[]): SnapshotRepo[] {
  const byName = new Map<string, SnapshotRepo>();

  for (const snapshot of snapshots) {
    for (const repo of snapshot.repositories ?? []) {
      const existing = byName.get(repo.fullName);
      if (!existing || repo.starsToday > existing.starsToday) byName.set(repo.fullName, repo);
    }
  }

  return Array.from(byName.values())
    .sort((a, b) => b.starsToday - a.starsToday || b.stars - a.stars)
    .slice(0, 5);
}

/** Dedupe opportunities by id, most recently published first. */
function aggregateTopOpportunities(snapshots: DailySnapshot[]): SnapshotOpportunity[] {
  const byId = new Map<string, SnapshotOpportunity>();

  for (const snapshot of snapshots) {
    for (const opp of snapshot.opportunities ?? []) {
      if (!byId.has(opp.id)) byId.set(opp.id, opp);
    }
  }

  return Array.from(byId.values())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 5);
}

/** Surface the trends that recurred most across the week. */
function aggregateKeyTrends(snapshots: DailySnapshot[]): (SnapshotTrend & { mentions: number })[] {
  const byTitle = new Map<string, SnapshotTrend & { mentions: number }>();

  for (const snapshot of snapshots) {
    for (const trend of snapshot.trends ?? []) {
      const key = normalizeTitle(trend.title);
      const existing = byTitle.get(key);
      if (existing) existing.mentions += 1;
      else byTitle.set(key, { ...trend, mentions: 1 });
    }
  }

  return Array.from(byTitle.values())
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 6);
}

function buildReview(snapshots: DailySnapshot[]): WeeklyReview {
  // snapshots are ordered most-recent first
  const dates = snapshots.map((s) => s.date).sort();
  const weekStart = dates[0] ?? dateNDaysAgo(6);
  const weekEnd = dates[dates.length - 1] ?? dateNDaysAgo(0);

  return {
    weekStart,
    weekEnd,
    daysCovered: snapshots.length,
    biggestStories: aggregateBiggestStories(snapshots),
    topRepositories: aggregateTopRepositories(snapshots),
    topOpportunities: aggregateTopOpportunities(snapshots),
    keyTrends: aggregateKeyTrends(snapshots),
    marketSummary: snapshots[0]?.marketSummary ?? null,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Phase 3B — deterministic weekly executive briefing. Aggregates the last 7 days
 * of `daily_snapshots` (no AI, no per-user state). Cached for `WEEKLY_REVIEW`.
 */
export async function getWeeklyReview(): Promise<{ data: WeeklyReview; cached: boolean }> {
  const weekKey = dateNDaysAgo(0);
  return withCache(`weekly-review:${weekKey}`, CACHE_TTL.WEEKLY_REVIEW, async () => {
    const snapshots = await loadRecentSnapshots();
    return buildReview(snapshots);
  });
}
