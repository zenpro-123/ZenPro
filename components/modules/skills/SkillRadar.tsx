"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronDown, Radar } from "lucide-react";
import { SkillCard } from "@/components/modules/skills/SkillCard";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { SkillRadarResponse, SkillSource } from "@/types/opportunity-intel";

interface SkillRadarApiResponse {
  data: SkillRadarResponse;
  cached: boolean;
}

async function fetchSkills(): Promise<SkillRadarApiResponse> {
  const res = await fetch("/api/opportunity-intel/skills");
  if (!res.ok) throw new Error("Failed to load skill radar");
  return res.json();
}

const SOURCE_OPTIONS: { value: SkillSource | "all"; label: string }[] = [
  { value: "all", label: "All sources" },
  { value: "career", label: "Jobs" },
  { value: "github", label: "Repositories" },
  { value: "learning", label: "Learning" },
  { value: "tech", label: "Articles" },
  { value: "tools", label: "Tools" },
];

const PAGE_SIZE = 24;

/** Phase 4 — Skill Demand Radar: frequency-ranked skills with growth indicators. */
export function SkillRadar() {
  const [source, setSource] = useState<SkillSource | "all">("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["opportunity-intel", "skills"],
    queryFn: fetchSkills,
    staleTime: 30 * 60 * 1000,
  });

  const skills = useMemo(() => {
    if (!data?.data.skills) return [];
    const q = query.trim().toLowerCase();
    return data.data.skills.filter((s) => {
      if (source !== "all" && !s.sources.includes(source)) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, source, query]);

  function handleSourceChange(value: string) {
    setSource(value as SkillSource | "all");
    setVisibleCount(PAGE_SIZE);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
  }

  const visibleSkills = skills.slice(0, visibleCount);
  const remaining = skills.length - visibleSkills.length;

  return (
    <section className="space-y-6">
      <SectionHeader
        icon={Radar}
        eyebrow="Skills"
        title="Skill Demand Radar"
        subtitle="Technologies trending across jobs, repositories, articles, and learning resources"
        actions={
          <>
            <Input
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search skills"
              className="w-36"
            />
            <Select value={source} onValueChange={handleSourceChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      {isLoading && <CardGridSkeleton count={6} />}

      {isError && (
        <EmptyState
          icon={Radar}
          title="Couldn't load the skill radar"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {!isLoading && !isError && skills.length === 0 && (
        <EmptyState
          icon={Radar}
          title="No skills detected yet"
          description="As jobs, repos, and articles accumulate, in-demand skills will surface here."
        />
      )}

      {skills.length > 0 && (
        <>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {visibleSkills.map((skill) => (
              <motion.div key={skill.name} variants={staggerItem} className="h-full">
                <SkillCard skill={skill} />
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
                Show more
                <span className="text-muted-foreground">{Math.min(PAGE_SIZE, remaining)} more</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
