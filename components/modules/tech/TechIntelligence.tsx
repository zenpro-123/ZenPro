"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";
import { ArticleCard } from "@/components/modules/tech/ArticleCard";
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
import type { TechArticle } from "@/types/content";

interface TechResponse {
  data: TechArticle[];
  sources: string[];
  cached: boolean;
}

async function fetchTech(): Promise<TechResponse> {
  const res = await fetch("/api/content/tech");
  if (!res.ok) throw new Error("Failed to load tech intelligence");
  return res.json();
}

/** Module 4 — aggregated tech news with Quick/Detailed reading modes and source filtering. */
export function TechIntelligence() {
  const [mode, setMode] = useState<"quick" | "detailed">("quick");
  const [source, setSource] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["content-tech"],
    queryFn: fetchTech,
    staleTime: 15 * 60 * 1000,
  });

  const articles = useMemo(() => {
    if (!data?.data) return [];
    if (source === "all") return data.data;
    return data.data.filter((a) => a.source === source);
  }, [data, source]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Daily Tech Intelligence</h2>
          <p className="text-sm text-muted-foreground">
            The latest from The Verge, TechCrunch, GeekWire, and Hacker News
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.sources && data.sources.length > 0 && (
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {data.sources.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
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
          icon={Newspaper}
          title="Couldn't load tech intelligence"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {!isLoading && !isError && articles.length === 0 && (
        <EmptyState
          icon={Newspaper}
          title="No articles yet"
          description="Check back soon for the latest tech news."
        />
      )}

      {articles.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {articles.map((article) => (
            <motion.div key={article.id} variants={staggerItem}>
              <ArticleCard article={article} mode={mode} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
