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
import type { AssetType, MarketInsight, MarketItem } from "@/types/market";

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

const GROUP_ORDER: AssetType[] = ["index", "crypto", "commodity", "forex"];
const GROUP_LABELS: Record<AssetType, string> = {
  index: "Indices",
  crypto: "Crypto",
  commodity: "Commodities",
  forex: "Forex",
};

/** Module 16 — live indices, crypto, commodities, and forex with an AI digest. */
export function MarketPulse() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["content-market"],
    queryFn: fetchMarket,
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
  });

  const items = data?.data ?? [];

  // Group by assetType preserving GROUP_ORDER
  const grouped = GROUP_ORDER.reduce<Record<AssetType, MarketItem[]>>(
    (acc, type) => {
      acc[type] = items.filter((i) => i.assetType === type);
      return acc;
    },
    { index: [], crypto: [], commodity: [], forex: [] }
  );

  return (
    <section className="space-y-4">
      <SectionHeader
        icon={LineChart}
        eyebrow="Markets"
        title="Market Pulse"
        subtitle="Indices, crypto, commodities, and forex"
      />

      {isLoading && (
        <GlassCard static className="overflow-hidden">
          <TickerSkeleton count={12} />
        </GlassCard>
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
          <GlassCard static className="overflow-hidden">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              {GROUP_ORDER.map((type, groupIdx) => {
                const group = grouped[type];
                if (group.length === 0) return null;
                return (
                  <div key={type}>
                    {groupIdx > 0 && <div className="mx-4 border-t border-border/40" />}
                    <p className="px-4 pb-0.5 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {GROUP_LABELS[type]}
                    </p>
                    {group.map((item) => (
                      <motion.div key={item.symbol} variants={staggerItem}>
                        <TickerWidget item={item} />
                      </motion.div>
                    ))}
                  </div>
                );
              })}
              <div className="h-1" />
            </motion.div>
          </GlassCard>

          {data?.insight && (
            <GlassCard static className="px-4 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                What investors are watching
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{data.insight.summary}</p>
              {data.insight.watchItems.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.insight.watchItems.map((watchItem) => (
                    <Badge key={watchItem} variant="secondary" className="text-xs">
                      {watchItem}
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
