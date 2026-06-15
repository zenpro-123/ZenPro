"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { RefreshCw, Sparkles, ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { HeroSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ReadingTimeBadge } from "@/components/shared/ReadingTimeBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/userStore";
import type { MorningBrief } from "@/types/ai";

interface MorningBriefResponse {
  data: MorningBrief;
  cached: boolean;
}

async function fetchBrief(refresh = false): Promise<MorningBriefResponse> {
  const res = await fetch(`/api/ai/morning-brief${refresh ? "?refresh=true" : ""}`);
  if (!res.ok) throw new Error("Failed to load morning brief");
  return res.json();
}

/** Module 2 — personalized greeting + AI-synthesized "what's happening" hero. */
export function GoodMorning() {
  const queryClient = useQueryClient();
  const profile = useUserStore((s) => s.profile);
  const hydrated = useUserStore((s) => s.hydrated);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["morning-brief"],
    queryFn: () => fetchBrief(false),
    staleTime: 60 * 60 * 1000,
    enabled: !!profile,
  });

  async function handleRefresh() {
    const fresh = await fetchBrief(true);
    queryClient.setQueryData(["morning-brief"], fresh);
  }

  if (hydrated && !profile) {
    return (
      <GlassCard strong className="relative overflow-hidden p-6 sm:p-8">
        <div className="bg-aurora absolute inset-0 opacity-60" />
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Good morning 👋</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Sign in for your personalized briefing
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Get an AI-generated daily summary tailored to your interests, plus saved items,
              missions, and more.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </GlassCard>
    );
  }

  if (!profile || isLoading) return <HeroSkeleton />;

  if (isError || !data?.data) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Couldn't load your morning brief"
        description="We'll try again shortly — your daily intelligence briefing will appear here."
      />
    );
  }

  const brief = data.data;

  return (
    <GlassCard strong className="relative overflow-hidden p-6 sm:p-8">
      <div className="bg-aurora absolute inset-0 opacity-60" />
      <div className="relative">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-start justify-between gap-4"
        >
          <div>
            <p className="text-sm font-medium text-primary">{brief.greeting} 👋</p>
            <p className="mt-1 text-xs text-muted-foreground">{brief.date}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isFetching}
            className="shrink-0"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            <span className="sr-only">Refresh</span>
          </Button>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.05 }}
          className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
        >
          {brief.headline}
        </motion.h1>

        <div className="mt-4">
          <ReadingTimeBadge seconds={brief.readingTimeSeconds} />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-6 space-y-3"
        >
          {brief.developments.map((dev, i) => (
            <motion.div
              key={`${dev.title}-${i}`}
              variants={staggerItem}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium leading-snug">{dev.title}</h3>
                    {dev.sourceUrl && (
                      <a
                        href={dev.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  {dev.summary && (
                    <p className="text-sm leading-relaxed text-muted-foreground">{dev.summary}</p>
                  )}
                  {dev.whyItMatters && (
                    <p className="text-xs text-foreground/70">
                      <span className="font-medium text-primary">Why it matters: </span>
                      {dev.whyItMatters}
                    </p>
                  )}
                  <Badge variant="secondary" className="mt-1 capitalize">
                    {dev.category}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </GlassCard>
  );
}
