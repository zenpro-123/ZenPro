import { createHash } from "crypto";

/**
 * Deterministic content hash used as the unique key for `content_items`.
 * Combines source + normalized title + url so the same story re-published
 * with minor title edits across a refresh cycle still collapses to one row.
 */
export function contentHash(source: string, title: string, url?: string): string {
  const normalizedTitle = title.trim().toLowerCase().replace(/\s+/g, " ");
  const key = `${source}::${normalizedTitle}::${url ?? ""}`;
  return createHash("md5").update(key).digest("hex");
}

/**
 * Removes near-duplicate items (same normalized title) from a list,
 * keeping the first occurrence. Used after merging multiple RSS sources
 * that may cover the same story.
 */
export function dedupeByTitle<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = item.title.trim().toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}
