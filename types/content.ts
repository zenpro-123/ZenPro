import type { AIInsights } from "@/types/ai";

export type ContentCategory =
  | "tech"
  | "social"
  | "career"
  | "github"
  | "market"
  | "startup"
  | "learning"
  | "creator"
  | "instagram"
  | "x"
  | "tools";

/** Canonical shape for any aggregated content item, regardless of source. */
export interface ContentItem<TMetadata extends object = Record<string, unknown>> {
  id: string;
  source: string;
  category: ContentCategory;
  title: string;
  summary?: string;
  url?: string;
  author?: string;
  imageUrl?: string;
  publishedAt: string;
  metadata: TMetadata;
  contentHash: string;
  aiSummary?: string;
  aiInsights?: AIInsights;
  relevanceScore?: number;
  tags: string[];
}

export interface TechArticleMetadata {
  excerpt?: string;
  readingTimeSeconds?: number;
}

export type TechArticle = ContentItem<TechArticleMetadata> & { category: "tech" };

export interface GitHubRepoMetadata {
  fullName: string;
  stars: number;
  starsToday: number;
  language: string | null;
  forks: number;
  ownerAvatar?: string;
}

export type GitHubRepo = ContentItem<GitHubRepoMetadata> & { category: "github" };

export type CareerOpportunityType =
  | "job"
  | "internship"
  | "hackathon"
  | "scholarship"
  | "fellowship"
  | "accelerator"
  | "competition";

export interface CareerOpportunityMetadata {
  type: CareerOpportunityType;
  company: string;
  location?: string;
  remote: boolean;
  deadline?: string;
  salary?: string;
  tags?: string[];
}

export type CareerOpportunity = ContentItem<CareerOpportunityMetadata> & {
  category: "career";
};

export type TrendDirection = "up" | "down" | "stable" | "new";

export interface SocialTrendMetadata {
  platform: "x" | "instagram" | "reddit" | "youtube";
  trendDirection: TrendDirection;
  engagementCount?: number;
  growthScore?: number;
}

export type SocialTrend = ContentItem<SocialTrendMetadata> & { category: "social" };
