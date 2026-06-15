import type { DevelopmentImpact, TopDevelopment } from "@/types/ai";
import type { MarketInsight, MarketItem } from "@/types/market";

export interface SnapshotTrend {
  id: string;
  title: string;
  source: string;
  url?: string;
  platform: string;
}

export interface SnapshotRepo {
  id: string;
  fullName: string;
  description?: string;
  stars: number;
  starsToday: number;
  language: string | null;
  url?: string;
}

export interface SnapshotOpportunity {
  id: string;
  title: string;
  company: string;
  type: string;
  url?: string;
  publishedAt: string;
}

/** A single day's curated bundle — powers "Things You Should Know Today" and "What Changed". */
export interface DailySnapshot {
  date: string;
  topStories: TopDevelopment[];
  trends: SnapshotTrend[];
  repositories: SnapshotRepo[];
  opportunities: SnapshotOpportunity[];
  marketSummary: {
    items: MarketItem[];
    insight: MarketInsight;
  };
  generatedAt: string;
}

export type ChangeType = "new_story" | "rising_repo" | "new_opportunity" | "market_move" | "emerging_trend";

/** A single entry in "What Changed Since Yesterday". */
export interface ChangeItem {
  type: ChangeType;
  title: string;
  explanation: string;
  impact: DevelopmentImpact;
  url?: string;
}
