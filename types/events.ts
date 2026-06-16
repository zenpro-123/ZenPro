/**
 * Generic analytics event types for `public.user_events`. Kept as a small,
 * extensible union — the DB column is free-form `text`, but the API route
 * validates against this union so arbitrary strings are rejected.
 */
export type EventType =
  | "card_view"
  | "card_click"
  | "development_click"
  | "change_item_click"
  | "recommendation_click"
  | "recommendation_dismiss"
  | "item_save"
  | "item_unsave"
  | "collection_create"
  | "note_create"
  | "note_update"
  | "note_delete";

export const EVENT_TYPES: readonly EventType[] = [
  "card_view",
  "card_click",
  "development_click",
  "change_item_click",
  "recommendation_click",
  "recommendation_dismiss",
  "item_save",
  "item_unsave",
  "collection_create",
  "note_create",
  "note_update",
  "note_delete",
];

export interface TrackEventPayload {
  eventType: EventType;
  itemId?: string;
  properties?: Record<string, unknown>;
}
