"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContentStore } from "@/stores/contentStore";
import { useUserStore } from "@/stores/userStore";
import { useTrackEvent } from "@/lib/events/useTrackEvent";
import { cn } from "@/lib/utils";
import type { SaveItemPayload } from "@/types/saved";

interface SaveButtonProps {
  item: SaveItemPayload;
  className?: string;
}

async function saveItem(item: SaveItemPayload) {
  const res = await fetch("/api/saved-items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...item, collectionId: null, tags: [] }),
  });
  if (!res.ok) throw new Error("Failed to save item");
}

async function unsaveItem(contentHash: string) {
  const res = await fetch(`/api/saved-items?contentHash=${encodeURIComponent(contentHash)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to unsave item");
}

/** Bookmark toggle — saves/unsaves a content item, with optimistic UI via contentStore. */
export function SaveButton({ item, className }: SaveButtonProps) {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const toggleSaved = useContentStore((s) => s.toggleSaved);
  const isSaved = useContentStore((s) => s.isSaved(item.contentHash));
  const trackEvent = useTrackEvent();

  const mutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await unsaveItem(item.contentHash);
      } else {
        await saveItem(item);
      }
    },
    onMutate: () => {
      toggleSaved(item.contentHash);
    },
    onError: () => {
      toggleSaved(item.contentHash);
    },
    onSuccess: () => {
      trackEvent({
        eventType: isSaved ? "item_unsave" : "item_save",
        itemId: item.contentHash,
      });
    },
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={isSaved ? "Remove from saved items" : "Save item"}
      aria-pressed={isSaved}
      className={cn(isSaved && "text-primary", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!profile) {
          router.push("/login");
          return;
        }
        mutation.mutate();
      }}
    >
      {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
    </Button>
  );
}
