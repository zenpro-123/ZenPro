import type { ContentCategory } from "@/types/content";
import type { ContentItemRow } from "@/types/recommendation";

export interface Collection {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  /** Computed by the API from saved_items — not a DB column. */
  itemCount: number;
}

export interface SavedItem {
  id: string;
  userId: string;
  itemId: string;
  collectionId: string | null;
  tags: string[];
  createdAt: string;
}

export interface SavedItemWithContent extends SavedItem {
  content: ContentItemRow;
}

/**
 * Denormalized payload sent by content cards so /api/saved-items and /api/notes
 * can resolve or upsert the corresponding `content_items` row by `content_hash`.
 */
export interface SaveItemPayload {
  contentHash: string;
  source: string;
  category: ContentCategory;
  title: string;
  summary?: string;
  url?: string;
  author?: string;
  imageUrl?: string;
  publishedAt?: string;
}
