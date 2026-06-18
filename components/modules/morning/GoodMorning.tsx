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
      <GlassCard strong className="relative overflow-hidden p-6 sm:p-9">
        <div className="bg-aurora absolute inset-0 opacity-45" />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Your daily briefing
            </span>
            <h1 className="text-gradient mt-3 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.05]">
              Sign in for your personalized briefing
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Get an AI-generated daily summary tailored to your interests, plus saved items,
              missions, and more.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
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
    <GlassCard strong className="relative overflow-hidden p-6 sm:p-9">
      <div className="bg-aurora absolute inset-0 opacity-45" />
      <div className="relative">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-start justify-between gap-4"
        >
          <div>
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {brief.greeting}
            </span>
            <p className="mt-2 text-xs font-medium tracking-wide text-muted-foreground">
              {brief.date}
            </p>
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
          className="text-gradient mt-4 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.05]"
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
          className="mt-7 space-y-2.5"
        >
          {brief.developments.map((dev, i) => (
            <motion.div
              key={`${dev.title}-${i}`}
              variants={staggerItem}
              className="group rounded-2xl border border-foreground/[0.07] bg-foreground/[0.02] p-4 transition-all duration-200 hover:border-primary/25 hover:bg-foreground/[0.045]"
            >
              <div className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-xs font-semibold text-white shadow-sm shadow-primary/30">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading text-[0.95rem] font-medium leading-snug text-foreground">
                      {dev.title}
                    </h3>
                    {dev.sourceUrl && (
                      <a
                        href={dev.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg p-1 text-muted-foreground opacity-0 transition-all hover:bg-foreground/5 hover:text-foreground group-hover:opacity-100"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  {dev.summary && (
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {dev.summary}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pt-0.5">
                    <Badge variant="secondary" className="capitalize">
                      {dev.category}
                    </Badge>
                    {dev.whyItMatters && (
                      <p className="text-xs leading-relaxed text-foreground/65">
                        <span className="font-medium text-primary">Why it matters · </span>
                        {dev.whyItMatters}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </GlassCard>
  );
}
