"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Cpu } from "lucide-react";
import { EmergingTechCard } from "@/components/modules/emerging/EmergingTechCard";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { EmergingTechResponse } from "@/types/opportunity-intel";

interface EmergingTechApiResponse {
  data: EmergingTechResponse;
  cached: boolean;
}

async function fetchEmerging(): Promise<EmergingTechApiResponse> {
  const res = await fetch("/api/opportunity-intel/emerging");
  if (!res.ok) throw new Error("Failed to load emerging technologies");
  return res.json();
}

/** Phase 4 — Emerging Technologies: tech appearing across multiple data sources. */
export function EmergingTech() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["opportunity-intel", "emerging"],
    queryFn: fetchEmerging,
    staleTime: 30 * 60 * 1000,
  });

  const technologies = data?.data.technologies ?? [];

  return (
    <section className="space-y-6">
      <SectionHeader
        icon={Cpu}
        eyebrow="Emerging"
        title="Emerging Technologies"
        subtitle="Technologies gaining momentum across jobs, open source, and articles simultaneously"
      />

      {isLoading && <CardGridSkeleton count={6} />}

      {isError && (
        <EmptyState
          icon={Cpu}
          title="Couldn't load emerging technologies"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {!isLoading && !isError && technologies.length === 0 && (
        <EmptyState
          icon={Cpu}
          title="Nothing emerging yet"
          description="When a technology starts appearing across multiple sources, it'll surface here."
        />
      )}

      {technologies.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {technologies.map((tech) => (
            <motion.div key={tech.name} variants={staggerItem} className="h-full">
              <EmergingTechCard tech={tech} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
