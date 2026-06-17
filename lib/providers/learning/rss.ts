import Parser from "rss-parser";
import { BaseProvider, type ProviderConfig, type ProviderResult } from "@/lib/providers/base";
import { LEARNING_RSS_FEEDS } from "@/config/sources";
import { contentHash, dedupeByTitle } from "@/lib/utils/deduplication";
import { cleanSummary } from "@/lib/utils/formatting";
import { CACHE_TTL } from "@/lib/utils/cache";
import type { LearningArticle } from "@/types/content";

type FeedItem = Parser.Item & { "content:encoded"?: string; author?: string };

const parser = new Parser<object, FeedItem>({
  timeout: 10_000,
  customFields: { item: ["content:encoded", "author"] },
});

/** ~225 wpm reading speed, floored at 15s for very short snippets. */
function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(15, Math.round((words / 225) * 60));
}

function extractImage(item: FeedItem): string | undefined {
  if (item.enclosure?.url) return item.enclosure.url;
  const html = item["content:encoded"] ?? item.content;
  const match = html?.match(/<img[^>]+src="([^">]+)"/);
  return match?.[1].replace(/&#0?38;|&amp;/g, "&");
}

/**
 * Phase 3B — Learning Feed. Aggregates tutorial/educational RSS sources
 * (Dev.to, freeCodeCamp, Hacker News) into the canonical `LearningArticle`
 * shape. No auth, no API key, no AI.
 */
export class LearningRssProvider extends BaseProvider<LearningArticle> {
  readonly config: ProviderConfig = {
    id: "learning-rss",
    name: "Learning RSS Feeds",
    description: "Dev.to, freeCodeCamp, Hacker News",
    enabled: true,
    cacheTTLSeconds: CACHE_TTL.LEARNING,
  };

  async fetch(): Promise<ProviderResult<LearningArticle>> {
    try {
      const results = await Promise.allSettled(
        LEARNING_RSS_FEEDS.map((feed) => this.fetchFeed(feed))
      );

      let items: LearningArticle[] = [];
      for (const result of results) {
        if (result.status === "fulfilled") items.push(...result.value);
      }

      items = dedupeByTitle(items).sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      return this.ok(items);
    } catch (err) {
      return this.fail(err);
    }
  }

  private async fetchFeed(feed: (typeof LEARNING_RSS_FEEDS)[number]): Promise<LearningArticle[]> {
    const feedData = await parser.parseURL(feed.url);

    return (feedData.items ?? []).map((item) => {
      const title = item.title?.trim() ?? "Untitled";
      const url = item.link;
      const rawSummary =
        item["content:encoded"] ?? item.content ?? item.contentSnippet ?? item.summary ?? "";
      const summary = cleanSummary(rawSummary);
      const publishedAt = item.isoDate ?? item.pubDate ?? new Date().toISOString();
      const hash = contentHash(feed.id, title, url);

      const article: LearningArticle = {
        id: hash,
        source: feed.name,
        category: "learning",
        title,
        summary: summary || undefined,
        url,
        author: item.creator ?? item.author,
        imageUrl: extractImage(item),
        publishedAt,
        metadata: {
          excerpt: summary || undefined,
          readingTimeSeconds: estimateReadingTime(summary || title),
        },
        contentHash: hash,
        tags: (item.categories ?? []).slice(0, 4),
      };

      return article;
    });
  }
}

export const learningRssProvider = new LearningRssProvider();
