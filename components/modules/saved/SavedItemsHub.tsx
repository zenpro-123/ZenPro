"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bookmark, Settings, Search } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedItemCard } from "@/components/modules/saved/SavedItemCard";
import { CollectionManagerDialog } from "@/components/modules/saved/CollectionManagerDialog";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useUserStore } from "@/stores/userStore";
import { isEnabled } from "@/config/features";
import type { Collection, SavedItemWithContent } from "@/types/saved";

interface CollectionsResponse {
  data: Collection[];
}

interface SavedItemsResponse {
  data: SavedItemWithContent[];
}

async function fetchCollections(): Promise<CollectionsResponse> {
  const res = await fetch("/api/collections");
  if (!res.ok) throw new Error("Failed to load collections");
  return res.json();
}

async function fetchSavedItems(collectionId: string, q: string): Promise<SavedItemsResponse> {
  const params = new URLSearchParams();
  if (collectionId !== "all") params.set("collectionId", collectionId);
  if (q) params.set("q", q);
  const res = await fetch(`/api/saved-items?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load saved items");
  return res.json();
}

/** Module — Saved Items Hub: browse, search, and organize bookmarked content into collections. */
export function SavedItemsHub() {
  const enabled = isEnabled("SAVED_ITEMS");
  const profile = useUserStore((s) => s.profile);
  const hydrated = useUserStore((s) => s.hydrated);

  const [collectionId, setCollectionId] = useState("all");
  const [q, setQ] = useState("");
  const [managerOpen, setManagerOpen] = useState(false);

  const { data: collectionsData } = useQuery({
    queryKey: ["collections"],
    queryFn: fetchCollections,
    enabled: enabled && !!profile,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["saved-items", collectionId, q],
    queryFn: () => fetchSavedItems(collectionId, q),
    enabled: enabled && !!profile,
  });

  if (!enabled) return null;

  if (hydrated && !profile) {
    return (
      <GlassCard
        strong
        className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Saved Items</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to save articles, repos, and opportunities for later.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/login">Sign in</Link>
        </Button>
      </GlassCard>
    );
  }

  const collections = collectionsData?.data ?? [];
  const items = data?.data ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Saved Items</h2>
          <p className="text-sm text-muted-foreground">Everything you&apos;ve bookmarked, organized</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search saved items…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-44 pl-8 sm:w-56"
            />
          </div>
          <Select value={collectionId} onValueChange={setCollectionId}>
            <SelectTrigger size="sm" className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All collections</SelectItem>
              <SelectItem value="uncategorized">Uncategorized</SelectItem>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.name} ({collection.itemCount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={() => setManagerOpen(true)}>
            <Settings className="h-3.5 w-3.5" />
            Manage Collections
          </Button>
        </div>
      </div>

      {isLoading && <CardGridSkeleton count={6} />}

      {!isLoading && (isError || items.length === 0) && (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Use the bookmark icon on any card to save it here."
        />
      )}

      {items.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => (
            <motion.div key={item.id} variants={staggerItem}>
              <SavedItemCard item={item} collections={collections} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <CollectionManagerDialog open={managerOpen} onOpenChange={setManagerOpen} collections={collections} />
    </section>
  );
}
