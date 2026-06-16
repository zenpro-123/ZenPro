"use client";

import { useEffect } from "react";
import { useContentStore } from "@/stores/contentStore";

interface SavedItemsHydratorProps {
  savedContentHashes: string[];
}

/** Hydrates the Zustand content store's savedItemIds from server-fetched saved items on mount. */
export function SavedItemsHydrator({ savedContentHashes }: SavedItemsHydratorProps) {
  const setSavedItemIds = useContentStore((s) => s.setSavedItemIds);

  useEffect(() => {
    setSavedItemIds(savedContentHashes);
  }, [savedContentHashes, setSavedItemIds]);

  return null;
}
