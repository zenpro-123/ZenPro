"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Briefcase, ChevronDown } from "lucide-react";
import { OpportunityCard } from "@/components/modules/career/OpportunityCard";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { CareerOpportunity, CareerOpportunityType } from "@/types/content";

interface CareersResponse {
  data: CareerOpportunity[];
  types: CareerOpportunityType[];
  cached: boolean;
}

const TYPE_LABELS: Record<CareerOpportunityType, string> = {
  job: "Jobs",
  internship: "Internships",
  hackathon: "Hackathons",
  scholarship: "Scholarships",
  fellowship: "Fellowships",
  accelerator: "Accelerators",
  competition: "Competitions",
};

async function fetchCareers(): Promise<CareersResponse> {
  const res = await fetch("/api/content/careers");
  if (!res.ok) throw new Error("Failed to load career radar");
  return res.json();
}

/** How many opportunity tiles to reveal per page / "Read More" click. */
const PAGE_SIZE = 18;

/** Module 10 — remote jobs and internships, with Quick/Detailed reading modes and type filtering. */
export function CareerRadar() {
  const [mode, setMode] = useState<"quick" | "detailed">("quick");
  const [type, setType] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["content-careers"],
    queryFn: fetchCareers,
    staleTime: 60 * 60 * 1000,
  });

  const opportunities = useMemo(() => {
    if (!data?.data) return [];
    if (type === "all") return data.data;
    return data.data.filter((o) => o.metadata.type === type);
  }, [data, type]);

  // changing the type filter resets back to the first page
  function handleTypeChange(value: string) {
    setType(value);
    setVisibleCount(PAGE_SIZE);
  }

  const visibleOpportunities = opportunities.slice(0, visibleCount);
  const remaining = opportunities.length - visibleOpportunities.length;

  return (
    <section className="space-y-5">
      <SectionHeader
        icon={Briefcase}
        eyebrow="Career"
        title="Career Radar"
        subtitle="Remote jobs and internships worth a look"
        actions={
          <>
            {data?.types && data.types.length > 1 && (
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {data.types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Tabs value={mode} onValueChange={(v) => setMode(v as "quick" | "detailed")}>
              <TabsList>
                <TabsTrigger value="quick">Quick</TabsTrigger>
                <TabsTrigger value="detailed">Detailed</TabsTrigger>
              </TabsList>
            </Tabs>
          </>
        }
      />

      {isLoading && <CardGridSkeleton count={6} />}

      {isError && (
        <EmptyState
          icon={Briefcase}
          title="Couldn't load career radar"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {!isLoading && !isError && opportunities.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="No opportunities yet"
          description="Check back soon for new remote roles."
        />
      )}

      {opportunities.length > 0 && (
        <>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {visibleOpportunities.map((opportunity) => (
              <motion.div key={opportunity.id} variants={staggerItem} className="h-full">
                <OpportunityCard opportunity={opportunity} mode={mode} />
              </motion.div>
            ))}
          </motion.div>

          {remaining > 0 && (
            <div className="flex justify-center pt-1">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Read more
                <span className="text-muted-foreground">
                  {Math.min(PAGE_SIZE, remaining)} more
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
