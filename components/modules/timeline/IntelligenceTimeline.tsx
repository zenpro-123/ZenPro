"use client";

import { useState, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Briefcase,
  ChevronDown,
  GitFork,
  History,
  LineChart,
  Newspaper,
  Search,
  Star,
  TrendingUp,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ImpactBadge } from "@/components/shared/ImpactBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopDevelopmentCard } from "@/components/modules/intel/TopDevelopmentCard";
import { formatCompactNumber, formatRelativeTime } from "@/lib/utils/formatting";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { DailySnapshot, TimelineResponse } from "@/types/intelligence";
import type { TimelineCategory } from "@/app/api/intelligence/timeline/route";

const PAGE_SIZE = 7;

type ViewMode = "day" | "week" | "month";

const CATEGORIES: { value: TimelineCategory; label: string }[] = [
  { value: "tech", label: "Tech" },
  { value: "github", label: "GitHub" },
  { value: "career", label: "Career" },
  { value: "market", label: "Market" },
  { value: "learning", label: "Learning" },
  { value: "opportunities", label: "Opportunities" },
];

function getQuickNavDate(target: "today" | "yesterday" | "lastWeek" | "lastMonth"): string {
  const d = new Date();
  switch (target) {
    case "today":
      return d.toISOString().slice(0, 10);
    case "yesterday":
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    case "lastWeek":
      d.setDate(d.getDate() - 7);
      return d.toISOString().slice(0, 10);
    case "lastMonth":
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().slice(0, 10);
  }
}

async function fetchTimeline(opts: {
  before?: string;
  query?: string;
  category?: TimelineCategory | "";
  after?: string;
  limit?: number;
}): Promise<TimelineResponse> {
  const params = new URLSearchParams({ limit: String(opts.limit ?? PAGE_SIZE) });
  if (opts.before) params.set("before", opts.before);
  if (opts.after) params.set("after", opts.after);
  if (opts.query) params.set("q", opts.query);
  if (opts.category) params.set("category", opts.category);
  const res = await fetch(`/api/intelligence/timeline?${params}`);
  if (!res.ok) throw new Error("Failed to load intelligence timeline");
  return res.json();
}

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatWeekRange(dates: string[]): string {
  if (dates.length === 0) return "";
  const sorted = [...dates].sort();
  const start = new Date(`${sorted[0]}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const end = new Date(`${sorted[sorted.length - 1]}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${start} — ${end}`;
}

function formatMonthLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getWeekKey(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

function getMonthKey(date: string): string {
  return date.slice(0, 7);
}

function mergeSnapshots(snapshots: DailySnapshot[]): DailySnapshot {
  const topStoriesMap = new Map<string, DailySnapshot["topStories"][0]>();
  const repoMap = new Map<string, DailySnapshot["repositories"][0]>();
  const oppMap = new Map<string, DailySnapshot["opportunities"][0]>();
  const trendMap = new Map<string, DailySnapshot["trends"][0]>();

  for (const s of snapshots) {
    for (const story of s.topStories) topStoriesMap.set(story.id, story);
    for (const repo of s.repositories) repoMap.set(repo.id, repo);
    for (const opp of s.opportunities) oppMap.set(opp.id, opp);
    for (const trend of s.trends) trendMap.set(trend.id, trend);
  }

  const lastMarket = snapshots.find((s) => s.marketSummary.items.length > 0)?.marketSummary ?? { items: [], insight: { summary: "", watchItems: [], generatedAt: new Date().toISOString() } };

  return {
    date: snapshots[0].date,
    topStories: [...topStoriesMap.values()].slice(0, 10),
    repositories: [...repoMap.values()].slice(0, 8),
    opportunities: [...oppMap.values()].slice(0, 8),
    trends: [...trendMap.values()],
    marketSummary: lastMarket,
    generatedAt: snapshots[0].generatedAt,
  };
}

function SubHeader({ icon: Icon, title }: { icon: typeof Star; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h4 className="font-heading text-base font-semibold tracking-tight">{title}</h4>
    </div>
  );
}

function TimelineDayCard({ snapshot, label }: { snapshot: DailySnapshot; label?: string }) {
  const [expanded, setExpanded] = useState(false);
  const { topStories, repositories, opportunities, trends, marketSummary } = snapshot;

  const counts = [
    topStories.length > 0 ? `${topStories.length} stor${topStories.length === 1 ? "y" : "ies"}` : null,
    repositories.length > 0 ? `${repositories.length} repo${repositories.length === 1 ? "" : "s"}` : null,
    opportunities.length > 0 ? `${opportunities.length} opp${opportunities.length === 1 ? "" : "s"}` : null,
    trends.length > 0 ? `${trends.length} trend${trends.length === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <GlassCard static className="overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-foreground/[0.03]"
      >
        <span
          aria-hidden
          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-primary to-chart-2"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-base font-semibold tracking-tight">
              {label ?? formatDay(snapshot.date)}
            </h3>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                expanded && "rotate-180"
              )}
            />
          </div>

          {!expanded && topStories.length > 0 && (
            <ul className="space-y-1.5">
              {topStories.slice(0, 3).map((story, i) => (
                <li key={story.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-xs font-semibold text-primary">{i + 1}.</span>
                  <span className="line-clamp-1 flex-1">{story.title}</span>
                  <ImpactBadge impact={story.impact} className="hidden shrink-0 sm:inline-flex" />
                </li>
              ))}
            </ul>
          )}

          {!expanded && counts && <p className="text-xs text-muted-foreground/80">{counts}</p>}
        </div>
      </button>

      {expanded && (
        <div className="space-y-8 border-t border-foreground/[0.06] p-5">
          {topStories.length > 0 && (
            <div className="space-y-3">
              <SubHeader icon={Newspaper} title="Things You Should Know" />
              {topStories.map((story, i) => (
                <TopDevelopmentCard key={story.id} development={story} index={i} />
              ))}
            </div>
          )}

          {repositories.length > 0 && (
            <div className="space-y-3">
              <SubHeader icon={GitFork} title="Trending Repositories" />
              <div className="grid gap-3 md:grid-cols-2">
                {repositories.map((repo) => (
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
                      <span className="text-primary">
                        +{formatCompactNumber(repo.starsToday)}/day
                      </span>
                      {repo.language && <Badge variant="secondary">{repo.language}</Badge>}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {opportunities.length > 0 && (
            <div className="space-y-3">
              <SubHeader icon={Briefcase} title="Opportunities" />
              <div className="grid gap-3 md:grid-cols-2">
                {opportunities.map((opp) => (
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
            </div>
          )}

          {marketSummary && marketSummary.items.length > 0 && (
            <div className="space-y-3">
              <SubHeader icon={LineChart} title="Market Summary" />
              <GlassCard className="space-y-4 p-5">
                {marketSummary.insight?.summary && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {marketSummary.insight.summary}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {marketSummary.items.map((item) => (
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
              </GlassCard>
            </div>
          )}

          {trends.length > 0 && (
            <div className="space-y-3">
              <SubHeader icon={TrendingUp} title="Key Trends" />
              <GlassCard className="flex flex-wrap gap-2 p-5">
                {trends.map((trend) => (
                  <a
                    key={trend.id}
                    href={trend.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary"
                  >
                    {trend.title}
                  </a>
                ))}
              </GlassCard>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

export function IntelligenceTimeline() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<TimelineCategory | "">("");
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [afterDate, setAfterDate] = useState<string | undefined>();

  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedQuery(value.trim()), 300);
  }

  function handleQuickNav(target: "today" | "yesterday" | "lastWeek" | "lastMonth") {
    setAfterDate(getQuickNavDate(target));
  }

  function clearFilters() {
    setSearchQuery("");
    setDebouncedQuery("");
    setActiveCategory("");
    setAfterDate(undefined);
  }

  const hasActiveFilters = debouncedQuery || activeCategory || afterDate;

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["timeline", debouncedQuery, activeCategory, afterDate],
      queryFn: ({ pageParam }) =>
        fetchTimeline({
          before: pageParam,
          query: debouncedQuery || undefined,
          category: activeCategory,
          after: afterDate,
          limit: viewMode === "month" ? 31 : viewMode === "week" ? 14 : PAGE_SIZE,
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore && lastPage.snapshots.length > 0
          ? lastPage.snapshots[lastPage.snapshots.length - 1].date
          : undefined,
      staleTime: 30 * 60 * 1000,
    });

  const groupedEntries = useMemo(() => {
    const snapshots = data?.pages.flatMap((page) => page.snapshots) ?? [];

    if (viewMode === "day") {
      return snapshots.map((s) => ({ key: s.date, label: formatDay(s.date), snapshot: s }));
    }

    const groups = new Map<string, DailySnapshot[]>();

    for (const snapshot of snapshots) {
      const key = viewMode === "week" ? getWeekKey(snapshot.date) : getMonthKey(snapshot.date);
      const existing = groups.get(key) ?? [];
      existing.push(snapshot);
      groups.set(key, existing);
    }

    return [...groups.entries()].map(([key, groupSnapshots]) => {
      const merged = mergeSnapshots(groupSnapshots);
      const label =
        viewMode === "week"
          ? formatWeekRange(groupSnapshots.map((s) => s.date))
          : formatMonthLabel(groupSnapshots[0].date);
      return { key, label, snapshot: merged };
    });
  }, [data, viewMode]);

  return (
    <section className="space-y-6">
      <SectionHeader
        icon={History}
        eyebrow="History"
        title="Intelligence Timeline"
        subtitle="Navigate your historical intelligence — stories, repos, opportunities, and trends."
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search timeline history…"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 glass"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View Mode */}
        <div className="flex items-center gap-1 rounded-lg bg-secondary/40 p-1">
          {(["day", "week", "month"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                viewMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() =>
                setActiveCategory((prev) => (prev === cat.value ? "" : cat.value))
              }
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                activeCategory === cat.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="flex flex-wrap items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Jump to:</span>
        {(
          [
            { key: "today", label: "Today" },
            { key: "yesterday", label: "Yesterday" },
            { key: "lastWeek", label: "Last Week" },
            { key: "lastMonth", label: "Last Month" },
          ] as const
        ).map((nav) => (
          <button
            key={nav.key}
            type="button"
            onClick={() => handleQuickNav(nav.key)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              afterDate === getQuickNavDate(nav.key)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {nav.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      )}

      {isError && (
        <EmptyState
          icon={History}
          title="Couldn't load the timeline"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {!isLoading && !isError && groupedEntries.length === 0 && (
        <EmptyState
          icon={History}
          title={hasActiveFilters ? "No matching results" : "No history yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : "As daily snapshots accumulate, they'll appear here day by day."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}

      {groupedEntries.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {groupedEntries.map((entry) => (
            <motion.div key={entry.key} variants={staggerItem}>
              <TimelineDayCard snapshot={entry.snapshot} label={entry.label} />
            </motion.div>
          ))}

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading…" : "Load earlier days"}
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </section>
  );
}
