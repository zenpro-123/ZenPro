import { createClient } from "@/lib/supabase/server";
import { reinforceVector } from "@/lib/personalization/vectors";
import type { ContentItemRow, RecommendationWeights, ScoredRecommendation } from "@/types/recommendation";

export const DEFAULT_WEIGHTS: RecommendationWeights = {
  interestWeight: 0.35,
  savedWeight: 0.15,
  viewedWeight: 0.1,
  recencyWeight: 0.25,
  popularityWeight: 0.15,
};

/** Candidate pool window — only recently-ingested content_items rows are eligible. */
const CANDIDATE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

interface AffinityRow {
  content_items: { category: string } | null;
}

/** Accumulates per-category affinity by reinforcing once per occurrence (view, save, event, ...). */
function buildAffinityVector(rows: AffinityRow[] | null | undefined): Record<string, number> {
  let vector: Record<string, number> = {};
  for (const row of rows ?? []) {
    const category = row.content_items?.category;
    if (!category) continue;
    vector = reinforceVector(vector, category);
  }
  return vector;
}

/** Recency decay (48h half-life) — matches the intelligence engine's scoring. */
function recencyScore(publishedAt: string | null, now: number): number {
  if (!publishedAt) return 0;
  const hoursAgo = Math.max(0, (now - new Date(publishedAt).getTime()) / (1000 * 60 * 60));
  return Math.pow(0.5, hoursAgo / 48);
}

/** GitHub items score by star velocity; everything else gets a neutral baseline. */
function popularityScore(item: ContentItemRow): number {
  if (item.category === "github") {
    const starsToday = (item.metadata as { starsToday?: number }).starsToday ?? 0;
    return Math.min(1, starsToday / 50);
  }
  return 0.5;
}

function categoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function buildReasons(contributions: Record<string, number>, item: ContentItemRow): string[] {
  const reasons: string[] = [];

  const ranked = Object.entries(contributions).sort((a, b) => b[1] - a[1]);
  for (const [key, value] of ranked) {
    if (value <= 0.02 || reasons.length >= 3) break;

    switch (key) {
      case "interest":
        reasons.push(`Matches your interest in ${categoryLabel(item.category)}`);
        break;
      case "saved":
        reasons.push("Similar to items you've saved");
        break;
      case "viewed":
        reasons.push("Similar to what you've been reading");
        break;
      case "recency":
        reasons.push("Published recently");
        break;
      case "popularity":
        reasons.push(item.category === "github" ? "Trending on GitHub" : "Popular right now");
        break;
    }
  }

  return reasons.length > 0 ? reasons : ["Recommended for you"];
}

/**
 * Weighted (non-embedding) recommendation engine: blends a user's stored interest
 * vector with their viewed/saved affinity (derived from `user_interactions`,
 * `user_events`, and `saved_items`) plus recency and popularity, over a pool of
 * recently-ingested `content_items`.
 */
export async function getRecommendations(userId: string, limit = 6): Promise<ScoredRecommendation[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - CANDIDATE_WINDOW_MS).toISOString();

  const [{ data: prefs }, { data: interactions }, { data: events }, { data: saved }, { data: candidates }] =
    await Promise.all([
      supabase.from("user_preferences").select("interest_vector").eq("user_id", userId).maybeSingle(),
      supabase
        .from("user_interactions")
        .select("content_items(category)")
        .eq("user_id", userId)
        .eq("action_type", "view")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("user_events")
        .select("content_items(category)")
        .eq("user_id", userId)
        .in("event_type", ["card_view", "card_click", "recommendation_click"])
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("saved_items").select("content_items(category)").eq("user_id", userId).limit(50),
      supabase
        .from("content_items")
        .select("*")
        .gte("published_at", since)
        .order("published_at", { ascending: false })
        .limit(100),
    ]);

  const interestVector = (prefs?.interest_vector as Record<string, number> | undefined) ?? {};
  const viewedAffinity = buildAffinityVector([
    ...((interactions ?? []) as unknown as AffinityRow[]),
    ...((events ?? []) as unknown as AffinityRow[]),
  ]);
  const savedAffinity = buildAffinityVector(saved as unknown as AffinityRow[] | null);

  const now = Date.now();

  const scored: ScoredRecommendation[] = ((candidates ?? []) as ContentItemRow[]).map((item) => {
    const contributions = {
      interest: (interestVector[item.category] ?? 0) * DEFAULT_WEIGHTS.interestWeight,
      saved: (savedAffinity[item.category] ?? 0) * DEFAULT_WEIGHTS.savedWeight,
      viewed: (viewedAffinity[item.category] ?? 0) * DEFAULT_WEIGHTS.viewedWeight,
      recency: recencyScore(item.published_at, now) * DEFAULT_WEIGHTS.recencyWeight,
      popularity: popularityScore(item) * DEFAULT_WEIGHTS.popularityWeight,
    };

    const score = Object.values(contributions).reduce((sum, value) => sum + value, 0);

    return { item, score, reasons: buildReasons(contributions, item) };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
