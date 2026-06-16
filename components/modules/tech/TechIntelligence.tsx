"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronDown, Newspaper } from "lucide-react";
import { ArticleCard } from "@/components/modules/tech/ArticleCard";
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

/** How many article tiles to reveal per page / "Read More" click. */
const PAGE_SIZE = 18;

/** Module 4 — aggregated tech news with Quick/Detailed reading modes and source filtering. */
export function TechIntelligence() {
  const [mode, setMode] = useState<"quick" | "detailed">("quick");
  const [source, setSource] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

  // changing the source filter resets back to the first page
  function handleSourceChange(value: string) {
    setSource(value);
    setVisibleCount(PAGE_SIZE);
  }

  const visibleArticles = articles.slice(0, visibleCount);
  const remaining = articles.length - visibleArticles.length;

  return (
    <section className="space-y-5">
      <SectionHeader
        icon={Newspaper}
        eyebrow="Tech"
        title="Daily Tech Intelligence"
        subtitle="The latest from The Verge, TechCrunch, GeekWire, and Hacker News"
        actions={
          <>
            {data?.sources && data.sources.length > 0 && (
              <Select value={source} onValueChange={handleSourceChange}>
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
          </>
        }
      />

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
        <>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {visibleArticles.map((article) => (
              <motion.div key={article.id} variants={staggerItem} className="h-full">
                <ArticleCard article={article} mode={mode} />
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
