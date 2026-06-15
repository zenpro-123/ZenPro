import type { ChangeItem, DailySnapshot } from "@/types/intelligence";
import type { DevelopmentImpact } from "@/types/ai";

/** Repo "rising" if its starsToday velocity increased by at least this much since yesterday. */
const RISING_REPO_MIN_DELTA = 5;

/** Market moves below this absolute percentage-point delta vs. yesterday are ignored. */
const MARKET_MOVE_THRESHOLD = 2;

const IMPACT_ORDER: Record<DevelopmentImpact, number> = { high: 0, medium: 1, low: 2 };

function popularityImpact(starsToday: number): DevelopmentImpact {
  const score = Math.min(1, starsToday / 50);
  if (score > 0.7) return "high";
  if (score > 0.4) return "medium";
  return "low";
}

function marketMoveImpact(deltaPercent: number): DevelopmentImpact {
  return Math.abs(deltaPercent) > 5 ? "high" : "medium";
}

/**
 * Pure, deterministic diff between two daily snapshots — powers "What Changed
 * Since Yesterday". On the first run (no prior snapshot), today's top stories
 * are surfaced as "new" with an explanation noting it's the first day.
 */
export function computeWhatChanged(today: DailySnapshot, yesterday: DailySnapshot | null): ChangeItem[] {
  if (!yesterday) {
    const firstRun: ChangeItem[] = today.topStories.map((story) => ({
      type: "new_story",
      title: story.title,
      explanation: "First snapshot — added to today's top developments.",
      impact: story.impact,
      url: story.sourceUrl,
    }));
    return firstRun.slice(0, 8);
  }

  const changes: ChangeItem[] = [];

  const yesterdayStoryIds = new Set(yesterday.topStories.map((s) => s.id));
  for (const story of today.topStories) {
    if (yesterdayStoryIds.has(story.id)) continue;
    changes.push({
      type: "new_story",
      title: story.title,
      explanation: story.whatHappened,
      impact: story.impact,
      url: story.sourceUrl,
    });
  }

  const yesterdayRepos = new Map(yesterday.repositories.map((r) => [r.fullName, r]));
  for (const repo of today.repositories) {
    const prev = yesterdayRepos.get(repo.fullName);
    if (!prev) {
      changes.push({
        type: "rising_repo",
        title: repo.fullName,
        explanation: `${repo.fullName} entered today's trending repos with ${repo.starsToday} stars/day.`,
        impact: popularityImpact(repo.starsToday),
        url: repo.url,
      });
    } else if (repo.starsToday - prev.starsToday >= RISING_REPO_MIN_DELTA) {
      changes.push({
        type: "rising_repo",
        title: repo.fullName,
        explanation: `${repo.fullName} climbed from ${prev.starsToday} to ${repo.starsToday} stars/day.`,
        impact: popularityImpact(repo.starsToday),
        url: repo.url,
      });
    }
  }

  const yesterdayOpportunities = new Set(yesterday.opportunities.map((o) => `${o.title}::${o.company}`));
  for (const opportunity of today.opportunities) {
    if (yesterdayOpportunities.has(`${opportunity.title}::${opportunity.company}`)) continue;
    changes.push({
      type: "new_opportunity",
      title: opportunity.title,
      explanation: `${opportunity.company} posted a new ${opportunity.type}: ${opportunity.title}.`,
      impact: "medium",
      url: opportunity.url,
    });
  }

  const yesterdayMarket = new Map(yesterday.marketSummary.items.map((item) => [item.symbol, item]));
  for (const item of today.marketSummary.items) {
    const prev = yesterdayMarket.get(item.symbol);
    if (!prev) continue;
    const delta = item.changePercent - prev.changePercent;
    if (Math.abs(delta) <= MARKET_MOVE_THRESHOLD) continue;
    const sign = delta > 0 ? "+" : "";
    changes.push({
      type: "market_move",
      title: item.displaySymbol,
      explanation: `${item.displaySymbol} moved ${sign}${delta.toFixed(1)}pp since yesterday.`,
      impact: marketMoveImpact(delta),
    });
  }

  const yesterdayTrendIds = new Set(yesterday.trends.map((t) => t.id));
  for (const trend of today.trends) {
    if (yesterdayTrendIds.has(trend.id)) continue;
    changes.push({
      type: "emerging_trend",
      title: trend.title,
      explanation: `${trend.title} is trending on ${trend.platform}.`,
      impact: "medium",
      url: trend.url,
    });
  }

  return changes.sort((a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact]).slice(0, 8);
}
