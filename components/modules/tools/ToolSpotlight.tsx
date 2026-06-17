"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronDown, Wrench } from "lucide-react";
import { ToolCard, CATEGORY_LABELS } from "@/components/modules/tools/ToolCard";
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
import type { Tool, ToolCategory } from "@/types/content";

interface ToolsResponse {
  data: Tool[];
  categories: ToolCategory[];
  cached: boolean;
}

async function fetchTools(): Promise<ToolsResponse> {
  const res = await fetch("/api/content/tools");
  if (!res.ok) throw new Error("Failed to load tool spotlight");
  return res.json();
}

/** How many tool tiles to reveal per page / "Read more" click. */
const PAGE_SIZE = 18;

/** Phase 3B — newly launched products from Product Hunt, with category + search filtering. */
export function ToolSpotlight() {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["content-tools"],
    queryFn: fetchTools,
    staleTime: 30 * 60 * 1000,
  });

  const tools = useMemo(() => {
    if (!data?.data) return [];
    const q = query.trim().toLowerCase();
    return data.data.filter((t) => {
      if (category !== "all" && t.metadata.toolCategory !== category) return false;
      if (q && !`${t.title} ${t.summary ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, category, query]);

  // changing the category filter resets back to the first page
  function handleCategoryChange(value: string) {
    setCategory(value);
    setVisibleCount(PAGE_SIZE);
  }

  // changing the search query resets back to the first page
  function handleQueryChange(value: string) {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
  }

  const visibleTools = tools.slice(0, visibleCount);
  const remaining = tools.length - visibleTools.length;

  return (
    <section className="space-y-6">
      <SectionHeader
        icon={Wrench}
        eyebrow="Tools"
        title="Tool Spotlight"
        subtitle="Fresh product launches from Product Hunt"
        actions={
          <>
            <Input
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search tools"
              className="w-40"
            />
            {data?.categories && data.categories.length > 0 && (
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {data.categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        }
      />

      {isLoading && <CardGridSkeleton count={6} />}

      {isError && (
        <EmptyState
          icon={Wrench}
          title="Couldn't load tool spotlight"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {!isLoading && !isError && tools.length === 0 && (
        <EmptyState
          icon={Wrench}
          title="No tools yet"
          description="Check back soon for the latest product launches."
        />
      )}

      {tools.length > 0 && (
        <>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {visibleTools.map((tool) => (
              <motion.div key={tool.id} variants={staggerItem} className="h-full">
                <ToolCard tool={tool} />
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
