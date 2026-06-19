"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Map as MapIcon } from "lucide-react";
import { OpportunityDiscoveryCard } from "@/components/modules/opportunities/OpportunityDiscoveryCard";
import { OpportunityAnalyticsSidebar } from "@/components/modules/opportunities/OpportunityAnalyticsSidebar";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { GlassCard } from "@/components/shared/GlassCard";
import { TrendBadge } from "@/components/shared/TrendBadge";
import { Badge } from "@/components/ui/badge";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { OpportunityMapResponse } from "@/types/opportunity-intel";
import type { SnapshotOpportunity } from "@/types/intelligence";

interface OpportunityMapApiResponse {
  data: OpportunityMapResponse;
  cached: boolean;
}

async function fetchOpportunities(): Promise<OpportunityMapApiResponse> {
  const res = await fetch("/api/opportunity-intel/opportunities");
  if (!res.ok) throw new Error("Failed to load opportunity map");
  return res.json();
}

type Tab = "new" | "recommended" | "category" | "skill";

const TABS: { value: Tab; label: string }[] = [
  { value: "new", label: "New" },
  { value: "recommended", label: "Recommended" },
  { value: "category", label: "By Category" },
  { value: "skill", label: "By Skill" },
];

function OpportunityGrid({ opportunities }: { opportunities: SnapshotOpportunity[] }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {opportunities.map((opp) => (
        <motion.div key={opp.id} variants={staggerItem} className="h-full">
          <OpportunityDiscoveryCard opportunity={opp} />
        </motion.div>
      ))}
    </motion.div>
  );
}

/** Phase 4 — Opportunity Map: discovery + analytics over recent career data. */
export function OpportunityMap() {
  const [tab, setTab] = useState<Tab>("new");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["opportunity-intel", "opportunities"],
    queryFn: fetchOpportunities,
    staleTime: 30 * 60 * 1000,
  });

  const analytics = data?.data.analytics;

  const byCategory = useMemo(() => {
    if (!analytics) return [];
    const groups = new Map<string, SnapshotOpportunity[]>();
    for (const opp of analytics.recentOpportunities) {
      const existing = groups.get(opp.type) ?? [];
      existing.push(opp);
      groups.set(opp.type, existing);
    }
    return [...groups.entries()];
  }, [analytics]);

  const isEmpty =
    !analytics ||
    (analytics.recentOpportunities.length === 0 &&
      analytics.recommendedOpportunities.length === 0);

  return (
    <section className="space-y-6">
      <SectionHeader
        icon={MapIcon}
        eyebrow="Opportunities"
        title="Opportunity Map"
        subtitle="Discover and track opportunities, with analytics on what's hiring right now"
      />

      {isLoading && <CardGridSkeleton count={6} />}

      {isError && (
        <EmptyState
          icon={MapIcon}
          title="Couldn't load the opportunity map"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {!isLoading && !isError && isEmpty && (
        <EmptyState
          icon={MapIcon}
          title="No opportunities yet"
          description="As career opportunities are ingested, they'll appear here with analytics."
        />
      )}

      {!isLoading && !isError && analytics && !isEmpty && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTab(t.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    tab === t.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "new" && <OpportunityGrid opportunities={analytics.recentOpportunities} />}

            {tab === "recommended" &&
              (analytics.recommendedOpportunities.length > 0 ? (
                <OpportunityGrid opportunities={analytics.recommendedOpportunities} />
              ) : (
                <EmptyState
                  icon={MapIcon}
                  title="No recommendations yet"
                  description="Recommendations appear as in-demand skills are detected across opportunities."
                />
              ))}

            {tab === "category" && (
              <div className="space-y-6">
                {byCategory.map(([category, opps]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-sm font-semibold capitalize tracking-tight">
                        {category}
                      </h3>
                      <Badge variant="secondary">{opps.length}</Badge>
                    </div>
                    <OpportunityGrid opportunities={opps} />
                  </div>
                ))}
              </div>
            )}

            {tab === "skill" &&
              (analytics.topSkills.length > 0 ? (
                <GlassCard className="divide-y divide-border/40 p-2">
                  {analytics.topSkills.map((skill, i) => (
                    <div
                      key={skill.skill}
                      className="flex items-center justify-between gap-3 px-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold tabular-nums text-muted-foreground/60">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-medium text-foreground">{skill.skill}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {skill.count} postings
                        </span>
                        <TrendBadge direction={skill.trend} showIcon={false} />
                      </div>
                    </div>
                  ))}
                </GlassCard>
              ) : (
                <EmptyState
                  icon={MapIcon}
                  title="No skill data yet"
                  description="Skill demand across opportunities will appear here."
                />
              ))}
          </div>

          <OpportunityAnalyticsSidebar analytics={analytics} />
        </div>
      )}
    </section>
  );
}
