import Parser from "rss-parser";
import { BaseProvider, type ProviderConfig, type ProviderResult } from "@/lib/providers/base";
import { PRODUCT_HUNT_FEEDS } from "@/config/sources";
import { contentHash, dedupeByTitle } from "@/lib/utils/deduplication";
import { cleanSummary } from "@/lib/utils/formatting";
import { CACHE_TTL } from "@/lib/utils/cache";
import type { Tool, ToolCategory } from "@/types/content";

type FeedItem = Parser.Item & { author?: string };

const parser = new Parser<object, FeedItem>({ timeout: 10_000 });

/**
 * Deterministic, keyword-based category for a launched product. Product Hunt's
 * feed carries no taxonomy, so we derive a coarse bucket from the title +
 * tagline. First match wins; everything else falls through to "other".
 */
const CATEGORY_PATTERNS: [ToolCategory, RegExp][] = [
  ["ai", /\bai\b|\bml\b|gpt|llm|agent|chatbot|machine learning|generative/i],
  ["developer", /\bapi\b|\bsdk\b|\bcli\b|dev(eloper)?|code|coding|github|deploy|database|backend|framework/i],
  ["design", /design|\bui\b|\bux\b|figma|prototyp|wireframe|icon|font|illustrat/i],
  ["marketing", /marketing|\bseo\b|growth|email campaign|ad(s|vert)|audience|funnel|crm/i],
  ["productivity", /product(ivity)?|workflow|notion|task|note|calendar|automat|organi[sz]e|team/i],
];

function deriveToolCategory(text: string): ToolCategory {
  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return "other";
}

/** Product Hunt appends "Discussion | Link" anchor text to every entry — drop it. */
function stripFeedBoilerplate(text: string): string {
  return text.replace(/\s*(Discussion\s*\|\s*Link|Discussion|Link)\s*$/i, "").trim();
}

/**
 * Phase 3B — Tool Spotlight. Aggregates Product Hunt's public Atom feed into the
 * canonical `Tool` shape. No auth, no API key, no AI: the PH tagline is used
 * verbatim as the summary, and the category is derived deterministically.
 */
export class ProductHuntProvider extends BaseProvider<Tool> {
  readonly config: ProviderConfig = {
    id: "product-hunt",
    name: "Product Hunt",
    description: "Newly launched products from Product Hunt",
    enabled: true,
    cacheTTLSeconds: CACHE_TTL.TOOLS,
    requiresAuth: false,
  };

  async fetch(): Promise<ProviderResult<Tool>> {
    try {
      const results = await Promise.allSettled(
        PRODUCT_HUNT_FEEDS.map((feed) => this.fetchFeed(feed))
      );

      let items: Tool[] = [];
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

  private async fetchFeed(feed: (typeof PRODUCT_HUNT_FEEDS)[number]): Promise<Tool[]> {
    const feedData = await parser.parseURL(feed.url);

    return (feedData.items ?? []).map((item) => {
      const title = item.title?.trim() ?? "Untitled";
      const url = item.link;
      const rawSummary = item.content ?? item.contentSnippet ?? item.summary ?? "";
      const tagline = stripFeedBoilerplate(cleanSummary(rawSummary));
      const publishedAt = item.isoDate ?? item.pubDate ?? new Date().toISOString();
      const toolCategory = deriveToolCategory(`${title} ${tagline}`);
      const hash = contentHash(feed.id, title, url);

      const tool: Tool = {
        id: hash,
        source: feed.name,
        category: "tools",
        title,
        summary: tagline || undefined,
        url,
        author: item.creator ?? item.author,
        publishedAt,
        metadata: {
          tagline: tagline || undefined,
          toolCategory,
        },
        contentHash: hash,
        tags: [toolCategory],
      };

      return tool;
    });
  }
}

export const productHuntProvider = new ProductHuntProvider();
