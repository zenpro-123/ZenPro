"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { History } from "lucide-react";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ChangeItemRow } from "@/components/modules/changed/ChangeItemRow";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { isEnabled } from "@/config/features";
import type { ChangeItem } from "@/types/intelligence";

interface ChangesResponse {
  data: ChangeItem[];
}

async function fetchChanges(): Promise<ChangesResponse> {
  const res = await fetch("/api/intelligence/changes");
  if (!res.ok) throw new Error("Failed to load what changed");
  return res.json();
}

/** Module — "What Changed Since Yesterday": a deterministic diff against yesterday's snapshot. */
export function WhatChanged() {
  const enabled = isEnabled("WHAT_CHANGED");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["intelligence-changes"],
    queryFn: fetchChanges,
    staleTime: 30 * 60 * 1000,
    enabled,
  });

  if (!enabled) return null;

  const changes = data?.data ?? [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">What Changed Since Yesterday</h2>
        <p className="text-sm text-muted-foreground">
          New stories, rising repos, opportunities, and market moves
        </p>
      </div>

      {isLoading && <CardGridSkeleton count={4} />}

      {!isLoading && (isError || changes.length === 0) && (
        <EmptyState
          icon={History}
          title="Nothing's changed yet"
          description="Check back tomorrow to see what's new since today's snapshot."
        />
      )}

      {changes.length > 0 && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {changes.map((change, i) => (
            <motion.div key={`${change.type}-${change.title}-${i}`} variants={staggerItem}>
              <ChangeItemRow change={change} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
