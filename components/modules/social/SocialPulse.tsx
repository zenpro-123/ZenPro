"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import { TrendCard } from "@/components/modules/social/TrendCard";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { isEnabled } from "@/config/features";
import type { SocialTrend } from "@/types/content";

interface SocialResponse {
  data: SocialTrend[];
  cached: boolean;
  errors?: { provider: string; error: string }[];
}

async function fetchSocial(): Promise<SocialResponse> {
  const res = await fetch("/api/content/social");
  if (!res.ok) throw new Error("Failed to load social pulse");
  return res.json();
}

/**
 * Module 7 — trending topics from X and Instagram. Both providers are
 * API-ready stubs pending V2 credentials/scraping infrastructure, so this
 * renders a "coming soon" state until `SOCIAL_PULSE` is enabled.
 */
export function SocialPulse() {
  const enabled = isEnabled("SOCIAL_PULSE");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["content-social"],
    queryFn: fetchSocial,
    staleTime: 15 * 60 * 1000,
    enabled,
  });

  if (!enabled) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Social Pulse</h2>
          <p className="text-sm text-muted-foreground">What&apos;s trending on X and Instagram</p>
        </div>
        <EmptyState
          icon={Radio}
          title="Coming in V2"
          description="X and Instagram providers are wired into the architecture and ready to go — they activate once API credentials and scraping infrastructure are configured."
        />
      </section>
    );
  }

  const trends = data?.data ?? [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Social Pulse</h2>
        <p className="text-sm text-muted-foreground">What&apos;s trending on X and Instagram</p>
      </div>

      {isLoading && <CardGridSkeleton count={3} />}

      {(isError || (!isLoading && trends.length === 0)) && (
        <EmptyState
          icon={Radio}
          title="No trends yet"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {trends.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {trends.map((trend) => (
            <motion.div key={trend.id} variants={staggerItem}>
              <TrendCard trend={trend} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
