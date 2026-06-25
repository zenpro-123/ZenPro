"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import { TrendCard } from "@/components/modules/social/TrendCard";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
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
      <section className="space-y-5">
        <SectionHeader
          icon={Radio}
          eyebrow="Social"
          title="Social Pulse"
          subtitle="What's blowing up on X and Instagram right now"
        />
        <EmptyState
          icon={Radio}
          title="Coming in V2"
          description="The viral threads, the spiciest takes, and the creators blowing up overnight — every big moment on X and Instagram, surfaced before it floods your feed. Don't be the last to know."
        />
      </section>
    );
  }

  const trends = data?.data ?? [];

  return (
    <section className="space-y-5">
      <SectionHeader
        icon={Radio}
        eyebrow="Social"
        title="Social Pulse"
        subtitle="What's blowing up on X and Instagram right now"
      />

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
          className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {trends.map((trend) => (
            <motion.div key={trend.id} variants={staggerItem} className="h-full">
              <TrendCard trend={trend} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
