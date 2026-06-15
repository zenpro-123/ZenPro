import Parser from "rss-parser";
import { BaseProvider, type ProviderConfig, type ProviderResult } from "@/lib/providers/base";
import { SOCIAL_RSS_FEEDS } from "@/config/sources";
import { contentHash, dedupeByTitle } from "@/lib/utils/deduplication";
import { CACHE_TTL } from "@/lib/utils/cache";
import type { SocialTrend } from "@/types/content";

const parser = new Parser({ timeout: 10_000 });

/**
 * Reddit trends — a real, free, RSS-based provider (r/technology, r/india top-of-day)
 * used by the daily snapshot service's "trends" field. Intentionally separate from
 * `socialProviders`/SocialPulse (X/Instagram stubs) so that module is untouched.
 */
export class RedditTrendsProvider extends BaseProvider<SocialTrend> {
  readonly config: ProviderConfig = {
    id: "reddit-trends",
    name: "Reddit Trends",
    description: "Top daily posts from r/technology and r/india",
    enabled: true,
    cacheTTLSeconds: CACHE_TTL.SOCIAL_TRENDS,
  };

  async fetch(): Promise<ProviderResult<SocialTrend>> {
    try {
      const results = await Promise.allSettled(SOCIAL_RSS_FEEDS.map((feed) => this.fetchFeed(feed)));

      let items: SocialTrend[] = [];
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

  private async fetchFeed(feed: (typeof SOCIAL_RSS_FEEDS)[number]): Promise<SocialTrend[]> {
    const feedData = await parser.parseURL(feed.url);

    return (feedData.items ?? []).map((item) => {
      const title = item.title?.trim() ?? "Untitled";
      const url = item.link;
      const summary = (item.contentSnippet ?? item.summary ?? "").trim();
      const publishedAt = item.isoDate ?? item.pubDate ?? new Date().toISOString();
      const hash = contentHash(feed.id, title, url);

      const trend: SocialTrend = {
        id: hash,
        source: feed.name,
        category: "social",
        title,
        summary: summary || undefined,
        url,
        author: item.creator,
        publishedAt,
        metadata: {
          platform: "reddit",
          trendDirection: "new",
        },
        contentHash: hash,
        tags: (item.categories ?? []).slice(0, 4),
      };

      return trend;
    });
  }
}

export const redditTrendsProvider = new RedditTrendsProvider();
