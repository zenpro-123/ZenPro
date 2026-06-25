import type { ContentCategory } from "@/types/content";

/** Structured AI insight attached to a content item. */
export interface AIInsights {
  whatHappened: string;
  whyItMatters: string;
  implications: string;
}

export type DevelopmentImpact = "high" | "medium" | "low";

/** A single entry in "Things You Should Know Today" — a clustered, scored, AI-synthesized development. */
export interface TopDevelopment {
  id: string;
  title: string;
  whatHappened: string;
  whyItMatters: string;
  implications: string;
  impact: DevelopmentImpact;
  category: ContentCategory;
  source: string;
  sourceUrl?: string;
  imageUrl?: string;
  /** Other sources covering the same story, when clustered. */
  relatedSources?: string[];
}

export interface MorningDevelopment {
  title: string;
  summary: string;
  whyItMatters: string;
  category: string;
  sourceUrl?: string;
}

/** Output of the Good Morning / "Things You Should Know Today" pipeline. */
export interface MorningBrief {
  greeting: string;
  date: string;
  headline: string;
  developments: MorningDevelopment[];
  readingTimeSeconds: number;
  generatedAt: string;
}

