import type { AIInsights } from "@/types/ai";
import type { ContentCategory } from "@/types/content";

/** Shape of a row from `public.content_items` (snake_case, as returned by Supabase). */
export interface ContentItemRow {
  id: string;
  source: string;
  category: ContentCategory;
  title: string;
  summary: string | null;
  url: string | null;
  author: string | null;
  image_url: string | null;
  published_at: string | null;
  metadata: Record<string, unknown>;
  content_hash: string;
  ai_summary: string | null;
  ai_insights: AIInsights | null;
  relevance_score: number | null;
  tags: string[];
  created_at: string;
}

export interface RecommendationWeights {
  interestWeight: number;
  savedWeight: number;
  viewedWeight: number;
  recencyWeight: number;
  popularityWeight: number;
}

export interface ScoredRecommendation {
  item: ContentItemRow;
  score: number;
  reasons: string[];
}
