"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Hammer } from "lucide-react";
import { ProjectIdeaCard } from "@/components/modules/build/ProjectIdeaCard";
import { CardGridSkeleton, CardSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { BuildNextResponse } from "@/types/opportunity-intel";

interface BuildNextApiResponse {
  data: BuildNextResponse;
  cached: boolean;
}

async function fetchIdeas(): Promise<BuildNextApiResponse> {
  const res = await fetch("/api/opportunity-intel/build");
  if (!res.ok) throw new Error("Failed to load project ideas");
  return res.json();
}

/** Phase 4 — Build This Next: deterministic project ideas from current trends. */
export function BuildThisNext() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["opportunity-intel", "build"],
    queryFn: fetchIdeas,
    staleTime: 30 * 60 * 1000,
  });

  const featured = data?.data.featured;
  const ideas = data?.data.ideas ?? [];

  return (
    <section className="space-y-6">
      <SectionHeader
        icon={Hammer}
        eyebrow="Build"
        title="Build This Next"
        subtitle="Project ideas generated from trending skills, repositories, and tools"
      />

      {isLoading && (
        <div className="space-y-6">
          <CardSkeleton />
          <CardGridSkeleton count={6} />
        </div>
      )}

      {isError && (
        <EmptyState
          icon={Hammer}
          title="Couldn't load project ideas"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {!isLoading && !isError && !featured && (
        <EmptyState
          icon={Hammer}
          title="No ideas yet"
          description="As trending skills and repositories accumulate, project ideas will appear here."
        />
      )}

      {featured && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <ProjectIdeaCard idea={featured} featured />
        </motion.div>
      )}

      {ideas.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {ideas.map((idea) => (
            <motion.div key={idea.id} variants={staggerItem} className="h-full">
              <ProjectIdeaCard idea={idea} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
