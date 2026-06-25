"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LineChart } from "lucide-react";
import { TickerWidget } from "@/components/modules/market/TickerWidget";
import { TickerSkeleton } from "@/components/shared/SkeletonLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { GlassCard } from "@/components/shared/GlassCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
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
    // Refresh on a ~1h cadence so an open dashboard stays current without
    // hammering the providers (only polls while the tab is focused).
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
  });

  const items = data?.data ?? [];

  return (
    <section className="space-y-5">
      <SectionHeader
        icon={LineChart}
        eyebrow="Markets"
        title="Market Pulse"
        subtitle="Indices, crypto, commodities, and forex"
      />

      {isLoading && (
        <div className="@container">
          <TickerSkeleton count={12} />
        </div>
      )}

      {!isLoading && (isError || items.length === 0) && (
        <EmptyState
          icon={LineChart}
          title="Couldn't load market data"
          description="We'll retry on the next refresh cycle."
        />
      )}

      {items.length > 0 && (
        <>
          <div className="@container">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-3 @sm:grid-cols-3"
            >
              {items.map((item) => (
                <motion.div key={item.symbol} variants={staggerItem}>
                  <TickerWidget item={item} />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {data?.insight && (
            <GlassCard static className="px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What investors are watching</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{data.insight.summary}</p>
              {data.insight.watchItems.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.insight.watchItems.map((item) => (
                    <Badge key={item} variant="secondary" className="text-xs">
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
