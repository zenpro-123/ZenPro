import { createServiceClient } from "@/lib/supabase/server";
import type { SaveItemPayload } from "@/types/saved";

/**
 * Resolves (upserting if necessary) the `content_items.id` for a denormalized
 * card payload, keyed on `content_hash`. Only fields present in `payload` are
 * written, so a thin payload (e.g. from "Things You Should Know Today", which
 * lacks summary/author/imageUrl/publishedAt) never clobbers richer data the
 * snapshot service already wrote for the same `content_hash`.
 */
export async function resolveContentItemId(payload: SaveItemPayload): Promise<string> {
  const row: Record<string, unknown> = {
    source: payload.source,
    category: payload.category,
    title: payload.title,
    content_hash: payload.contentHash,
  };

  if (payload.summary !== undefined) row.summary = payload.summary;
  if (payload.url !== undefined) row.url = payload.url;
  if (payload.author !== undefined) row.author = payload.author;
  if (payload.imageUrl !== undefined) row.image_url = payload.imageUrl;
  if (payload.publishedAt !== undefined) row.published_at = payload.publishedAt;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("content_items")
    .upsert(row, { onConflict: "content_hash" })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to resolve content item");
  }

  return data.id as string;
}
