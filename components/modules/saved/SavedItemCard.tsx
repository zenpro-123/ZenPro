"use client";

import { ArrowUpRight, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/shared/GlassCard";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { CardActions } from "@/components/shared/CardActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRelativeTime, truncate } from "@/lib/utils/formatting";
import { useContentStore } from "@/stores/contentStore";
import { useTrackEvent } from "@/lib/events/useTrackEvent";
import type { Collection, SavedItemWithContent, SaveItemPayload } from "@/types/saved";

interface SavedItemCardProps {
  item: SavedItemWithContent;
  collections: Collection[];
}

export function SavedItemCard({ item, collections }: SavedItemCardProps) {
  const queryClient = useQueryClient();
  const toggleSaved = useContentStore((s) => s.toggleSaved);
  const trackEvent = useTrackEvent();
  const { content } = item;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["saved-items"] });
    queryClient.invalidateQueries({ queryKey: ["collections"] });
  }

  const moveCollection = useMutation({
    mutationFn: async (collectionId: string | null) => {
      const res = await fetch(`/api/saved-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId }),
      });
      if (!res.ok) throw new Error("Failed to move item");
    },
    onSuccess: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/saved-items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove item");
    },
    onSuccess: () => {
      toggleSaved(content.content_hash);
      trackEvent({ eventType: "item_unsave", itemId: content.content_hash });
      invalidate();
    },
  });

  const payload: SaveItemPayload = {
    contentHash: content.content_hash,
    source: content.source,
    category: content.category,
    title: content.title,
    summary: content.summary ?? undefined,
    url: content.url ?? undefined,
    author: content.author ?? undefined,
    imageUrl: content.image_url ?? undefined,
    publishedAt: content.published_at ?? undefined,
  };

  return (
    <GlassCard className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <SourceBadge source={content.source} />
        <CardActions item={payload} />
      </div>

      {content.url ? (
        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-2"
        >
          <h3 className="flex-1 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
            {content.title}
          </h3>
          <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </a>
      ) : (
        <h3 className="text-sm font-medium leading-snug text-foreground">{content.title}</h3>
      )}

      {content.summary && (
        <p className="text-sm leading-relaxed text-muted-foreground">{truncate(content.summary, 140)}</p>
      )}

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <Select
          value={item.collectionId ?? "uncategorized"}
          onValueChange={(value) => moveCollection.mutate(value === "uncategorized" ? null : value)}
        >
          <SelectTrigger size="sm" className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uncategorized">Uncategorized</SelectItem>
            {collections.map((collection) => (
              <SelectItem key={collection.id} value={collection.id}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
          {content.published_at && <span>{formatRelativeTime(content.published_at)}</span>}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Remove from saved items"
            onClick={() => removeItem.mutate()}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
