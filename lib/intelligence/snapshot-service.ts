import { fetchFromProviders } from "@/lib/providers/base";
import { techRssProvider } from "@/lib/providers/rss";
import { githubTrendingProvider } from "@/lib/providers/github";
import { careerProviders } from "@/lib/providers/careers";
import { marketProviders } from "@/lib/providers/market";
import { redditTrendsProvider } from "@/lib/providers/social/reddit";
import { buildTopDevelopments } from "@/lib/intelligence/intelligence-engine";
import { generateMarketInsight } from "@/lib/ai/market-insight";
import { withCache, CACHE_TTL } from "@/lib/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { DailySnapshot, SnapshotRepo, SnapshotOpportunity, SnapshotTrend } from "@/types/intelligence";
import type { TopDevelopment } from "@/types/ai";
import type { ContentItem, TechArticle, GitHubRepo, CareerOpportunity, SocialTrend } from "@/types/content";
import type { MarketItem, MarketInsight } from "@/types/market";

/** Accepts any of the category-specific `ContentItem<...>` variants (tech, github, career, ...). */
type AnyContentItem = ContentItem<object>;

interface DailySnapshotRow {
  snapshot_date: string;
  top_stories: TopDevelopment[];
  trends: SnapshotTrend[];
  repositories: SnapshotRepo[];
  opportunities: SnapshotOpportunity[];
  market_summary: { items: MarketItem[]; insight: MarketInsight };
  generated_at: string;
}

/** Mirrors `getRedis()`'s graceful-degradation pattern for the service-role client. */
function isConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapRow(row: DailySnapshotRow): DailySnapshot {
  return {
    date: row.snapshot_date,
    topStories: row.top_stories,
    trends: row.trends,
    repositories: row.repositories,
    opportunities: row.opportunities,
    marketSummary: row.market_summary,
    generatedAt: row.generated_at,
  };
}

function toContentItemRow(item: AnyContentItem) {
  return {
    source: item.source,
    category: item.category,
    title: item.title,
    summary: item.summary ?? null,
    url: item.url ?? null,
    author: item.author ?? null,
    image_url: item.imageUrl ?? null,
    published_at: item.publishedAt,
    metadata: item.metadata,
    content_hash: item.contentHash,
    ai_summary: item.aiSummary ?? null,
    ai_insights: item.aiInsights ?? null,
    relevance_score: item.relevanceScore ?? null,
    tags: item.tags,
  };
}

/** Best-effort persistence — failures never block returning the snapshot to the caller. */
async function persistSnapshot(date: string, snapshot: DailySnapshot, candidates: AnyContentItem[]): Promise<void> {
  if (!isConfigured()) return;

  try {
    const supabase = createServiceClient();

    await Promise.allSettled([
      supabase.from("daily_snapshots").upsert(
        {
          snapshot_date: date,
          top_stories: snapshot.topStories,
          trends: snapshot.trends,
          repositories: snapshot.repositories,
          opportunities: snapshot.opportunities,
          market_summary: snapshot.marketSummary,
          generated_at: snapshot.generatedAt,
        },
        { onConflict: "snapshot_date" }
      ),
      candidates.length > 0
        ? supabase.from("content_items").upsert(candidates.map(toContentItemRow), { onConflict: "content_hash" })
        : Promise.resolve(),
    ]);
  } catch {
    // Snapshot persistence is best-effort.
  }
}

/**
 * Fetches fresh data from every snapshot source, builds "Things You Should Know
 * Today", derives the repos/opportunities/trends/market summaries, persists the
 * bundle to `daily_snapshots` and the flattened candidates to `content_items`
 * (both best-effort), and returns the assembled snapshot.
 */
export async function generateSnapshot(date: string): Promise<DailySnapshot> {
  const [tech, github, career, market, reddit] = await Promise.all([
    fetchFromProviders<TechArticle>([techRssProvider]),
    fetchFromProviders<GitHubRepo>([githubTrendingProvider]),
    fetchFromProviders<CareerOpportunity>(careerProviders),
    fetchFromProviders<MarketItem>(marketProviders),
    fetchFromProviders<SocialTrend>([redditTrendsProvider]),
  ]);

  const topStories = await buildTopDevelopments([...tech.items, ...github.items, ...career.items]);

  const repositories: SnapshotRepo[] = [...github.items]
    .sort((a, b) => b.metadata.starsToday - a.metadata.starsToday)
    .slice(0, 5)
    .map((repo) => ({
      id: repo.id,
      fullName: repo.metadata.fullName,
      description: repo.summary,
      stars: repo.metadata.stars,
      starsToday: repo.metadata.starsToday,
      language: repo.metadata.language,
      url: repo.url,
    }));

  const opportunities: SnapshotOpportunity[] = [...career.items]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.title,
      company: item.metadata.company,
      type: item.metadata.type,
      url: item.url,
      publishedAt: item.publishedAt,
    }));

  const trends: SnapshotTrend[] = reddit.items.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    source: item.source,
    url: item.url,
    platform: item.metadata.platform,
  }));

  const marketSummary = {
    items: market.items,
    insight: await generateMarketInsight(market.items),
  };

  const snapshot: DailySnapshot = {
    date,
    topStories,
    trends,
    repositories,
    opportunities,
    marketSummary,
    generatedAt: new Date().toISOString(),
  };

  const candidates = [...tech.items.slice(0, 20), ...github.items.slice(0, 15), ...career.items.slice(0, 15)];
  await persistSnapshot(date, snapshot, candidates);

  return snapshot;
}

/** Read-only lookup of a previously generated snapshot. `null` if none exists for that date. */
export async function getSnapshot(date: string): Promise<DailySnapshot | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("daily_snapshots")
      .select("*")
      .eq("snapshot_date", date)
      .maybeSingle();

    if (error || !data) return null;
    return mapRow(data as DailySnapshotRow);
  } catch {
    return null;
  }
}

/**
 * Read-only, newest-first page of previously generated snapshots — powers the
 * Intelligence Timeline. Cursor-paginated by `snapshot_date`: pass the last date
 * you've seen as `before` to fetch the next (older) page. Fetches one extra row
 * to report `hasMore` without a separate count query.
 */
export async function listSnapshots(
  opts: { limit?: number; before?: string; after?: string } = {}
): Promise<{ snapshots: DailySnapshot[]; hasMore: boolean }> {
  const limit = Math.min(Math.max(opts.limit ?? 7, 1), 30);

  try {
    const supabase = await createClient();
    let query = supabase
      .from("daily_snapshots")
      .select("*")
      .order("snapshot_date", { ascending: false })
      .limit(limit + 1);

    if (opts.before) query = query.lt("snapshot_date", opts.before);
    if (opts.after) query = query.gte("snapshot_date", opts.after);

    const { data, error } = await query;
    if (error || !data) return { snapshots: [], hasMore: false };

    const hasMore = data.length > limit;
    const snapshots = data.slice(0, limit).map((row) => mapRow(row as DailySnapshotRow));
    return { snapshots, hasMore };
  } catch {
    return { snapshots: [], hasMore: false };
  }
}

/**
 * Returns today's snapshot, generating and persisting it on first request of the
 * day. Cached (memory → Redis → Supabase) for `CACHE_TTL.SNAPSHOT` seconds so
 * repeated requests within the window reuse the same bundle.
 */
export async function getOrCreateTodaySnapshot(): Promise<{ data: DailySnapshot; cached: boolean }> {
  const date = todayDate();

  return withCache(`snapshot:${date}`, CACHE_TTL.SNAPSHOT, async () => {
    const existing = await getSnapshot(date);
    if (existing) return existing;
    return generateSnapshot(date);
  });
}
