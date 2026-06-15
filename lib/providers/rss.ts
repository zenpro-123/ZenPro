import Parser from "rss-parser";
import { BaseProvider, type ProviderConfig, type ProviderResult } from "@/lib/providers/base";
import { TECH_RSS_FEEDS } from "@/config/sources";
import { contentHash, dedupeByTitle } from "@/lib/utils/deduplication";
import { CACHE_TTL } from "@/lib/utils/cache";
import type { TechArticle } from "@/types/content";

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
 * Aggregates Module 4's RSS sources (The Verge, TechCrunch, GeekWire, Hacker News)
 * into the canonical `TechArticle` shape. Backs both Tech Intelligence and the
 * Good Morning brief.
 */
export class TechRssProvider extends BaseProvider<TechArticle> {
  readonly config: ProviderConfig = {
    id: "tech-rss",
    name: "Tech RSS Feeds",
    description: "The Verge, TechCrunch, GeekWire, Hacker News",
    enabled: true,
    cacheTTLSeconds: CACHE_TTL.TECH_NEWS,
  };

  async fetch(): Promise<ProviderResult<TechArticle>> {
    try {
      const results = await Promise.allSettled(
        TECH_RSS_FEEDS.map((feed) => this.fetchFeed(feed))
      );

      let items: TechArticle[] = [];
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

  private async fetchFeed(feed: (typeof TECH_RSS_FEEDS)[number]): Promise<TechArticle[]> {
    const feedData = await parser.parseURL(feed.url);

    return (feedData.items ?? []).map((item) => {
      const title = item.title?.trim() ?? "Untitled";
      const url = item.link;
      const summary = (item.contentSnippet ?? item.summary ?? "").trim();
      const publishedAt = item.isoDate ?? item.pubDate ?? new Date().toISOString();
      const hash = contentHash(feed.id, title, url);

      const article: TechArticle = {
        id: hash,
        source: feed.name,
        category: "tech",
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

export const techRssProvider = new TechRssProvider();
