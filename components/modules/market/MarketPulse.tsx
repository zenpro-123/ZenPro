"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LineChart } from "lucide-react";
import { TickerWidget } from "@/components/modules/market/TickerWidget";
import { TickerSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { GlassCard } from "@/components/shared/GlassCard";
import { Badge } from "@/components/ui/badge";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { MarketInsight, MarketItem } from "@/types/market";

interface MarketResponse {
  data: MarketItem[];
  insight: MarketInsight;
  cached: boolean;
  errors?: { provider: string; error: string }[];
}

async function fetchMarket(): Promise<MarketResponse> {
  const res = await fetch("/api/content/market");
  if (!res.ok) throw new Error("Failed to load market pulse");
  return res.json();
}

/** Module 16 — live indices, crypto, commodities, and forex with an AI "what investors are watching" digest. */
export function MarketPulse() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["content-market"],
    queryFn: fetchMarket,
    staleTime: 5 * 60 * 1000,
  });

  const items = data?.data ?? [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Market Pulse</h2>
        <p className="text-sm text-muted-foreground">Indices, crypto, commodities, and forex</p>
      </div>

      {isLoading && <TickerSkeleton count={7} />}

      {!isLoading && (isError || items.length === 0) && (
        <EmptyState
          icon={LineChart}
          title="Couldn't load market data"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {items.length > 0 && (
        <>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex gap-3 overflow-x-auto pb-2"
          >
            {items.map((item) => (
              <motion.div key={item.symbol} variants={staggerItem} className="shrink-0">
                <TickerWidget item={item} />
              </motion.div>
            ))}
          </motion.div>

          {data?.insight && (
            <GlassCard className="p-5">
              <h3 className="text-sm font-medium text-foreground">What investors are watching</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{data.insight.summary}</p>
              {data.insight.watchItems.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.insight.watchItems.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}
            </GlassCard>
          )}
        </>
      )}
    </section>
  );
}
