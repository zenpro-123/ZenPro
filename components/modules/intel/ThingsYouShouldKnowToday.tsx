"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { HeroSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ReadingTimeBadge, estimateReadingTime } from "@/components/shared/ReadingTimeBadge";
import { TopDevelopmentCard } from "@/components/modules/intel/TopDevelopmentCard";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion";
import { isEnabled } from "@/config/features";
import type { TopDevelopment } from "@/types/ai";

interface TodayResponse {
  data: { topStories: TopDevelopment[]; generatedAt: string };
  cached: boolean;
}

async function fetchToday(): Promise<TodayResponse> {
  const res = await fetch("/api/intelligence/today");
  if (!res.ok) throw new Error("Failed to load today's developments");
  return res.json();
}

/** Flagship module — "Things You Should Know Today": top 5 clustered, AI-synthesized developments. */
export function ThingsYouShouldKnowToday() {
  const enabled = isEnabled("THINGS_TO_KNOW");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["intelligence-today"],
    queryFn: fetchToday,
    staleTime: 30 * 60 * 1000,
    enabled,
  });

  if (!enabled) return null;
  if (isLoading) return <HeroSkeleton />;

  const stories = data?.data?.topStories ?? [];

  if (isError || stories.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Nothing to report yet"
        description="Check back soon for today's most important developments."
      />
    );
  }

  const readingTimeSeconds = stories.reduce(
    (sum, story) =>
      sum + estimateReadingTime(`${story.whatHappened} ${story.whyItMatters} ${story.implications}`),
    0
  );

  return (
    <GlassCard strong className="relative overflow-hidden p-6 sm:p-8">
      <div className="bg-aurora absolute inset-0 opacity-60" />
      <div className="relative">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <p className="text-sm font-medium text-primary">Things you should know today</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Today&apos;s top developments
          </h2>
          <div className="mt-4">
            <ReadingTimeBadge seconds={readingTimeSeconds} />
          </div>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-6 space-y-3">
          {stories.map((story, i) => (
            <motion.div key={story.id} variants={staggerItem}>
              <TopDevelopmentCard development={story} index={i} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </GlassCard>
  );
}
