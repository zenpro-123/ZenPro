"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Briefcase,
  CalendarCheck,
  GitFork,
  LineChart,
  Newspaper,
  Star,
  TrendingUp,
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TopDevelopmentCard } from "@/components/modules/intel/TopDevelopmentCard";
import { formatCompactNumber, formatRelativeTime } from "@/lib/utils/formatting";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { WeeklyReview as WeeklyReviewData } from "@/types/intelligence";

interface WeeklyResponse {
  data: WeeklyReviewData;
  cached: boolean;
}

async function fetchWeekly(): Promise<WeeklyResponse> {
  const res = await fetch("/api/intelligence/weekly");
  if (!res.ok) throw new Error("Failed to load weekly review");
  return res.json();
}

function SubHeader({ icon: Icon, title }: { icon: typeof Star; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="font-heading text-lg font-semibold tracking-tight">{title}</h3>
    </div>
  );
}

function formatRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return start === end ? fmt(end) : `${fmt(start)} – ${fmt(end)}`;
}

/** Phase 3B — deterministic weekly executive briefing aggregated from daily snapshots. */
export function WeeklyReview() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["weekly-review"],
    queryFn: fetchWeekly,
    staleTime: 30 * 60 * 1000,
  });

  const review = data?.data;

  return (
    <section className="space-y-8">
      <SectionHeader
        icon={CalendarCheck}
        eyebrow="Weekly Review"
        title="Your week in intelligence"
        subtitle={
          review
            ? `${formatRange(review.weekStart, review.weekEnd)} · ${review.daysCovered} day${review.daysCovered === 1 ? "" : "s"} covered`
            : "A deterministic executive briefing of the past week"
        }
      />

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      )}

      {isError && (
        <EmptyState
          icon={CalendarCheck}
          title="Couldn't load your weekly review"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {review && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-10"
        >
          {/* Biggest Stories */}
          {review.biggestStories.length > 0 && (
            <motion.div variants={staggerItem} className="space-y-4">
              <SubHeader icon={Newspaper} title="Biggest Stories" />
              <div className="space-y-3">
                {review.biggestStories.map((story, i) => (
                  <TopDevelopmentCard key={story.id} development={story} index={i} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Top Repositories */}
          {review.topRepositories.length > 0 && (
            <motion.div variants={staggerItem} className="space-y-4">
              <SubHeader icon={GitFork} title="Top Repositories" />
              <div className="grid gap-3 md:grid-cols-2">
                {review.topRepositories.map((repo) => (
                  <GlassCard key={repo.id} className="flex flex-col gap-2 p-4">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link flex items-start justify-between gap-2"
                    >
                      <span className="text-sm font-semibold leading-snug transition-colors group-hover/link:text-primary">
                        {repo.fullName}
                      </span>
                      <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary" />
                    </a>
                    {repo.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{repo.description}</p>
                    )}
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground/80">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {formatCompactNumber(repo.stars)}
                      </span>
                      <span className="text-primary">+{formatCompactNumber(repo.starsToday)}/day</span>
                      {repo.language && <Badge variant="secondary">{repo.language}</Badge>}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          {/* Top Opportunities */}
          {review.topOpportunities.length > 0 && (
            <motion.div variants={staggerItem} className="space-y-4">
              <SubHeader icon={Briefcase} title="Top Opportunities" />
              <div className="grid gap-3 md:grid-cols-2">
                {review.topOpportunities.map((opp) => (
                  <GlassCard key={opp.id} className="flex flex-col gap-1.5 p-4">
                    <a
                      href={opp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link flex items-start justify-between gap-2"
                    >
                      <span className="text-sm font-semibold leading-snug transition-colors group-hover/link:text-primary">
                        {opp.title}
                      </span>
                      <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary" />
                    </a>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/80">
                      <span>{opp.company}</span>
                      <Badge variant="secondary">{opp.type}</Badge>
                      <span>{formatRelativeTime(opp.publishedAt)}</span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          {/* Market Summary */}
          {review.marketSummary && (
            <motion.div variants={staggerItem} className="space-y-4">
              <SubHeader icon={LineChart} title="Market Summary" />
              <GlassCard className="space-y-4 p-5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {review.marketSummary.insight.summary}
                </p>
                {review.marketSummary.items.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {review.marketSummary.items.map((item) => (
                      <div key={item.symbol} className="rounded-xl bg-secondary/40 p-3">
                        <div className="text-xs font-medium text-muted-foreground">
                          {item.displaySymbol}
                        </div>
                        <div className="text-sm font-semibold">
                          {item.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                        <div
                          className={cn(
                            "text-xs font-medium",
                            item.changePercent >= 0 ? "text-positive" : "text-negative"
                          )}
                        >
                          {item.changePercent >= 0 ? "+" : ""}
                          {item.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* Key Trends */}
          {review.keyTrends.length > 0 && (
            <motion.div variants={staggerItem} className="space-y-4">
              <SubHeader icon={TrendingUp} title="Key Trends" />
              <GlassCard className="flex flex-wrap gap-2 p-5">
                {review.keyTrends.map((trend) => (
                  <a
                    key={trend.id}
                    href={trend.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary"
                  >
                    {trend.title}
                    {trend.mentions > 1 && (
                      <span className="text-xs text-primary">×{trend.mentions}</span>
                    )}
                  </a>
                ))}
              </GlassCard>
            </motion.div>
          )}
        </motion.div>
      )}
    </section>
  );
}
