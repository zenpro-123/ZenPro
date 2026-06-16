import type { ContentItem } from "@/types/content";
import type { SaveItemPayload } from "@/types/saved";

/** Maps any aggregated `ContentItem<...>` (article, repo, opportunity, ...) to a SaveItemPayload. */
export function toSaveItemPayload(item: ContentItem<object>): SaveItemPayload {
  return {
    contentHash: item.contentHash,
    source: item.source,
    category: item.category,
    title: item.title,
    summary: item.summary,
    url: item.url,
    author: item.author,
    imageUrl: item.imageUrl,
    publishedAt: item.publishedAt,
  };
}
