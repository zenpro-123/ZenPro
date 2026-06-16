"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { RecommendationCard } from "@/components/modules/recommendations/RecommendationCard";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useUserStore } from "@/stores/userStore";
import { isEnabled } from "@/config/features";
import type { ScoredRecommendation } from "@/types/recommendation";

interface RecommendationsResponse {
  data: ScoredRecommendation[];
}

async function fetchRecommendations(): Promise<RecommendationsResponse> {
  const res = await fetch("/api/recommendations");
  if (!res.ok) throw new Error("Failed to load recommendations");
  return res.json();
}

/** Module — "Recommended For You": weighted personalized picks from the recommendation engine. */
export function RecommendedForYou() {
  const enabled = isEnabled("RECOMMENDED_FOR_YOU");
  const profile = useUserStore((s) => s.profile);
  const hydrated = useUserStore((s) => s.hydrated);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
    staleTime: 15 * 60 * 1000,
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
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Recommended For You
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to get picks tailored to your interests and reading habits.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/login">Sign in</Link>
        </Button>
      </GlassCard>
    );
  }

  const recommendations = data?.data ?? [];

  return (
    <section className="space-y-5">
      <SectionHeader
        icon={Compass}
        eyebrow="For you"
        title="Recommended For You"
        subtitle="Picks based on your interests and reading habits"
      />

      {(!profile || isLoading) && <CardGridSkeleton count={3} />}

      {profile && !isLoading && (isError || recommendations.length === 0) && (
        <EmptyState
          icon={Compass}
          title="No recommendations yet"
          description="Keep exploring — we'll start tailoring picks as we learn your interests."
        />
      )}

      {recommendations.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {recommendations.map((rec) => (
            <motion.div key={rec.item.id} variants={staggerItem} className="h-full">
              <RecommendationCard recommendation={rec} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
