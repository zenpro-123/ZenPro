import { NextRequest, NextResponse } from "next/server";
import { listSnapshots, getOrCreateTodaySnapshot } from "@/lib/intelligence/snapshot-service";
import { checkRateLimit } from "@/lib/api/with-rate-limit";
import type { DailySnapshot } from "@/types/intelligence";

export type TimelineCategory = "tech" | "career" | "market" | "github" | "learning" | "opportunities";

function filterSnapshot(snapshot: DailySnapshot, category: TimelineCategory): DailySnapshot {
  switch (category) {
    case "tech":
      return { ...snapshot, repositories: [], opportunities: [], marketSummary: { items: [], insight: snapshot.marketSummary.insight } };
    case "github":
      return { ...snapshot, topStories: [], opportunities: [], trends: [], marketSummary: { items: [], insight: snapshot.marketSummary.insight } };
    case "career":
    case "opportunities":
      return { ...snapshot, topStories: [], repositories: [], trends: [], marketSummary: { items: [], insight: snapshot.marketSummary.insight } };
    case "market":
      return { ...snapshot, topStories: [], repositories: [], opportunities: [], trends: [] };
    case "learning":
      return { ...snapshot, repositories: [], opportunities: [], marketSummary: { items: [], insight: snapshot.marketSummary.insight } };
    default:
      return snapshot;
  }
}

function searchSnapshot(snapshot: DailySnapshot, query: string): DailySnapshot {
  const q = query.toLowerCase();
  return {
    ...snapshot,
    topStories: snapshot.topStories.filter((s) => s.title.toLowerCase().includes(q) || s.whatHappened?.toLowerCase().includes(q)),
    repositories: snapshot.repositories.filter((r) => r.fullName.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)),
    opportunities: snapshot.opportunities.filter((o) => o.title.toLowerCase().includes(q) || o.company.toLowerCase().includes(q)),
    trends: snapshot.trends.filter((t) => t.title.toLowerCase().includes(q)),
  };
}

function isSnapshotEmpty(snapshot: DailySnapshot): boolean {
  return (
    snapshot.topStories.length === 0 &&
    snapshot.repositories.length === 0 &&
    snapshot.opportunities.length === 0 &&
    snapshot.trends.length === 0 &&
    snapshot.marketSummary.items.length === 0
  );
}

/**
 * Newest-first, cursor-paginated history of daily snapshots for the Intelligence
 * Timeline. Supports `?q=` search, `?category=` filtering, `?after=` for date
 * range, and `?before=` for cursor pagination.
 */
export async function GET(request: NextRequest) {
  const limited = await checkRateLimit();
  if (limited) return limited;

  const params = request.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number.parseInt(params.get("limit") ?? "7", 10) || 7, 1), 50);
  const before = params.get("before") ?? undefined;
  const after = params.get("after") ?? undefined;
  const query = params.get("q")?.trim() ?? "";
  const category = (params.get("category") ?? "") as TimelineCategory | "";

  let { snapshots, hasMore } = await listSnapshots({
    limit,
    before,
    after,
  });

  if (!before && !after && snapshots.length === 0) {
    await getOrCreateTodaySnapshot();
    ({ snapshots, hasMore } = await listSnapshots({ limit }));
  }

  if (category) {
    snapshots = snapshots.map((s) => filterSnapshot(s, category));
  }

  if (query) {
    snapshots = snapshots.map((s) => searchSnapshot(s, query));
  }

  if (category || query) {
    snapshots = snapshots.filter((s) => !isSnapshotEmpty(s));
  }

  return NextResponse.json({ snapshots, hasMore });
}
