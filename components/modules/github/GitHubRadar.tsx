"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GitFork } from "lucide-react";
import { RepoCard } from "@/components/modules/github/RepoCard";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { GitHubRepo } from "@/types/content";

interface GitHubResponse {
  data: GitHubRepo[];
  cached: boolean;
  error?: string;
}

async function fetchGithub(): Promise<GitHubResponse> {
  const res = await fetch("/api/content/github");
  if (!res.ok) throw new Error("Failed to load GitHub radar");
  return res.json();
}

/** Module 12 — recently created repos gaining stars fast, with Quick/Detailed reading modes. */
export function GitHubRadar() {
  const [mode, setMode] = useState<"quick" | "detailed">("quick");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["content-github"],
    queryFn: fetchGithub,
    staleTime: 60 * 60 * 1000,
  });

  const repos = data?.data ?? [];

  return (
    <section className="space-y-5">
      <SectionHeader
        icon={GitFork}
        eyebrow="Open source"
        title="GitHub Radar"
        subtitle="New repos gaining stars fast over the last week"
        actions={
          <Tabs value={mode} onValueChange={(v) => setMode(v as "quick" | "detailed")}>
            <TabsList>
              <TabsTrigger value="quick">Quick</TabsTrigger>
              <TabsTrigger value="detailed">Detailed</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {isLoading && <CardGridSkeleton count={6} />}

      {(isError || (!isLoading && data?.error && repos.length === 0)) && (
        <EmptyState
          icon={GitFork}
          title="Couldn't load GitHub radar"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {!isLoading && !isError && !data?.error && repos.length === 0 && (
        <EmptyState
          icon={GitFork}
          title="No trending repos yet"
          description="Check back soon for newly trending repositories."
        />
      )}

      {repos.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {repos.map((repo) => (
            <motion.div key={repo.id} variants={staggerItem} className="h-full">
              <RepoCard repo={repo} mode={mode} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
