import type { DataProvider } from "@/lib/providers/base";
import type { LearningArticle } from "@/types/content";
import { learningRssProvider } from "@/lib/providers/learning/rss";

/** Learning Feed providers (Phase 3B). Add future sources here — `fetchFromProviders` aggregates them. */
export const learningProviders: DataProvider<LearningArticle>[] = [learningRssProvider];
