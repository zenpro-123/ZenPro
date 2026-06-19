"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Signal } from "lucide-react";
import { SignalCard } from "@/components/modules/signals/SignalCard";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { CareerSignalsResponse, SignalType } from "@/types/opportunity-intel";

interface CareerSignalsApiResponse {
  data: CareerSignalsResponse;
  cached: boolean;
}

async function fetchSignals(): Promise<CareerSignalsApiResponse> {
  const res = await fetch("/api/opportunity-intel/signals");
  if (!res.ok) throw new Error("Failed to load career signals");
  return res.json();
}

const FILTERS: { value: SignalType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hiring_trend", label: "Hiring" },
  { value: "skill_demand", label: "Skill Demand" },
  { value: "technology_shift", label: "Tech Shifts" },
  { value: "market_pattern", label: "Market" },
];

/** Phase 4 — Career Signals: deterministic hiring/skill/technology analytics. */
export function CareerSignals() {
  const [filter, setFilter] = useState<SignalType | "all">("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["opportunity-intel", "signals"],
    queryFn: fetchSignals,
    staleTime: 30 * 60 * 1000,
  });

  const signals = useMemo(() => {
    if (!data?.data.signals) return [];
    if (filter === "all") return data.data.signals;
    return data.data.signals.filter((s) => s.type === filter);
  }, [data, filter]);

  return (
    <section className="space-y-6">
      <SectionHeader
        icon={Signal}
        eyebrow="Intelligence"
        title="Career Signals"
        subtitle="What's happening in hiring and technology, derived from the last two weeks of data"
      />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <CardGridSkeleton count={4} />}

      {isError && (
        <EmptyState
          icon={Signal}
          title="Couldn't load career signals"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {!isLoading && !isError && signals.length === 0 && (
        <EmptyState
          icon={Signal}
          title="No signals yet"
          description="As career and tech data accumulate, hiring and technology signals will surface here."
        />
      )}

      {signals.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {signals.map((signal) => (
            <motion.div key={signal.id} variants={staggerItem}>
              <SignalCard signal={signal} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
