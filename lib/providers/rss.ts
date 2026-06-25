import Parser from "rss-parser";
import { BaseProvider, type ProviderConfig, type ProviderResult } from "@/lib/providers/base";
import { TECH_RSS_FEEDS } from "@/config/sources";
import { contentHash, dedupeByTitle } from "@/lib/utils/deduplication";
import { cleanSummary } from "@/lib/utils/formatting";
import { CACHE_TTL } from "@/lib/utils/cache";
import type { TechArticle } from "@/types/content";

type MediaContent = { $?: { url?: string; medium?: string }; url?: string };
type FeedItem = Parser.Item & {
  "content:encoded"?: string;
  author?: string;
  "media:content"?: MediaContent | MediaContent[];
  "media:thumbnail"?: MediaContent;
};

const parser = new Parser<object, FeedItem>({
  timeout: 10_000,
  customFields: {
    item: ["content:encoded", "author", "media:content", "media:thumbnail"],
  },
});

/** Attempt to fetch og:image from a URL's HTML head — used for HackerNews linked pages. */
async function fetchOgImage(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4_000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Range: "bytes=0-32767" },
    });
    clearTimeout(timer);
    const text = await res.text();
    const match = text.match(/<meta[^>]+(?:property="og:image"|name="og:image")[^>]+content="([^"]+)"/i)
      ?? text.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property="og:image"|name="og:image")/i);
    const raw = match?.[1];
    if (!raw) return undefined;
    const resolved = raw.startsWith("http") ? raw : new URL(raw, url).href;
    return resolved;
  } catch {
    return undefined;
  }
}

/** ~225 wpm reading speed, floored at 15s for very short snippets. */
function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(15, Math.round((words / 225) * 60));
}

function extractImage(item: FeedItem): string | undefined {
  // media:content (TechCrunch publishes images here)
  const media = item["media:content"];
  if (media) {
    const first = Array.isArray(media) ? media[0] : media;
    const url = first?.$?.url ?? first?.url;
    if (url) return url;
  }
  const thumb = item["media:thumbnail"];
  if (thumb) {
    const url = thumb.$?.url ?? thumb.url;
    if (url) return url;
  }
  // enclosure element
  if (item.enclosure?.url) return item.enclosure.url;
  // first <img> in content:encoded / content
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
    const isHackerNews = feed.id === "hackernews";

    const articlesWithImages = await Promise.all(
      (feedData.items ?? []).map(async (item) => {
        const title = item.title?.trim() ?? "Untitled";
        const url = item.link;
        const rawSummary =
          item["content:encoded"] ?? item.content ?? item.contentSnippet ?? item.summary ?? "";
        const summary = cleanSummary(rawSummary);
        const publishedAt = item.isoDate ?? item.pubDate ?? new Date().toISOString();
        const hash = contentHash(feed.id, title, url);

        let imageUrl = extractImage(item);
        // HN RSS items are just link aggregations with no embedded images;
        // scrape the linked page's og:image so daily intel cards have visuals.
        if (!imageUrl && isHackerNews && url) {
          imageUrl = await fetchOgImage(url);
        }

        const article: TechArticle = {
          id: hash,
          source: feed.name,
          category: "tech",
          title,
          summary: summary || undefined,
          url,
          author: item.creator ?? item.author,
          imageUrl,
          publishedAt,
          metadata: {
            excerpt: summary || undefined,
            readingTimeSeconds: estimateReadingTime(summary || title),
          },
          contentHash: hash,
          tags: (item.categories ?? []).slice(0, 4),
        };

        return article;
      })
    );

    return articlesWithImages;
  }
}

export const techRssProvider = new TechRssProvider();
