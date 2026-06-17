"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronDown, GraduationCap } from "lucide-react";
import { LearningCard } from "@/components/modules/learning/LearningCard";
import { CardGridSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { LearningArticle } from "@/types/content";

interface LearningResponse {
  data: LearningArticle[];
  sources: string[];
  cached: boolean;
}

async function fetchLearning(): Promise<LearningResponse> {
  const res = await fetch("/api/content/learning");
  if (!res.ok) throw new Error("Failed to load learning feed");
  return res.json();
}

/** How many article tiles to reveal per page / "Read more" click. */
const PAGE_SIZE = 18;

/** Phase 3B — tutorials & educational articles (Dev.to, freeCodeCamp, Hacker News). */
export function LearningFeed() {
  const [mode, setMode] = useState<"quick" | "detailed">("quick");
  const [source, setSource] = useState("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["content-learning"],
    queryFn: fetchLearning,
    staleTime: 15 * 60 * 1000,
  });

  const articles = useMemo(() => {
    if (!data?.data) return [];
    const q = query.trim().toLowerCase();
    return data.data.filter((a) => {
      if (source !== "all" && a.source !== source) return false;
      if (q && !`${a.title} ${a.summary ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, source, query]);

  // changing the source filter resets back to the first page
  function handleSourceChange(value: string) {
    setSource(value);
    setVisibleCount(PAGE_SIZE);
  }

  // changing the search query resets back to the first page
  function handleQueryChange(value: string) {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
  }

  const visibleArticles = articles.slice(0, visibleCount);
  const remaining = articles.length - visibleArticles.length;

  return (
    <section className="space-y-6">
      <SectionHeader
        icon={GraduationCap}
        eyebrow="Learning"
        title="Learning Feed"
        subtitle="Tutorials and deep dives from Dev.to, freeCodeCamp, and Hacker News"
        actions={
          <>
            <Input
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search"
              className="w-32"
            />
            {data?.sources && data.sources.length > 0 && (
              <Select value={source} onValueChange={handleSourceChange}>
                <SelectTrigger className="w-36">
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
          </>
        }
      />

      {isLoading && <CardGridSkeleton count={6} />}

      {isError && (
        <EmptyState
          icon={GraduationCap}
          title="Couldn't load learning feed"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {!isLoading && !isError && articles.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="No articles yet"
          description="Check back soon for the latest tutorials."
        />
      )}

      {articles.length > 0 && (
        <>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {visibleArticles.map((article) => (
              <motion.div key={article.id} variants={staggerItem} className="h-full">
                <LearningCard article={article} mode={mode} />
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
