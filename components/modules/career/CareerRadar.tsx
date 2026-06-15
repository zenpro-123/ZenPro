"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import { OpportunityCard } from "@/components/modules/career/OpportunityCard";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
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

/** Module 10 — remote jobs and internships, with Quick/Detailed reading modes and type filtering. */
export function CareerRadar() {
  const [mode, setMode] = useState<"quick" | "detailed">("quick");
  const [type, setType] = useState("all");

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

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Career Radar</h2>
          <p className="text-sm text-muted-foreground">Remote jobs and internships worth a look</p>
        </div>
        <div className="flex items-center gap-2">
          {data?.types && data.types.length > 1 && (
            <Select value={type} onValueChange={setType}>
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
        </div>
      </div>

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
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {opportunities.map((opportunity) => (
            <motion.div key={opportunity.id} variants={staggerItem}>
              <OpportunityCard opportunity={opportunity} mode={mode} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
