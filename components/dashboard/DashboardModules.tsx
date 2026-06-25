"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";
import { GoodMorning } from "@/components/modules/morning/GoodMorning";
import { ThingsYouShouldKnowToday } from "@/components/modules/intel/ThingsYouShouldKnowToday";
import { WhatChanged } from "@/components/modules/changed/WhatChanged";
import { MarketPulse } from "@/components/modules/market/MarketPulse";
import { TechIntelligence } from "@/components/modules/tech/TechIntelligence";
import { GitHubRadar } from "@/components/modules/github/GitHubRadar";
import { CareerRadar } from "@/components/modules/career/CareerRadar";
import { RecommendedForYou } from "@/components/modules/recommendations/RecommendedForYou";
import { SocialPulse } from "@/components/modules/social/SocialPulse";
import { useUIStore } from "@/stores/uiStore";

const heroWrap = "mx-auto w-full max-w-4xl";

/** Banner shown above the condensed Busy-mode view. */
function BusyBanner() {
  return (
    <div className="mx-auto flex w-full max-w-4xl items-center gap-2 rounded-full border border-warning/25 bg-warning/10 px-4 py-2 text-xs font-medium text-warning">
      <Zap className="h-3.5 w-3.5" />
      Busy mode — your 60-second summary. The full feed is one toggle away.
    </div>
  );
}

/**
 * Client-side dashboard composition. Reads `busyMode` from the UI store and
 * collapses to an executive summary (brief + intel + changes + markets) when on.
 *
 * Full layout uses a denser desktop grid to use horizontal space well:
 *  - Top: the daily hero + flagship intel (wide left) alongside "what changed"
 *    and market pulse (stacked right).
 *  - Then full-width feed grids (tech, github) and personalized rows below.
 * Everything collapses to a single stacked column on mobile.
 */
export function DashboardModules() {
  const busyMode = useUIStore((s) => s.busyMode);
  const busyModeAnimate = useUIStore((s) => s.busyModeAnimate);

  // Animate the swap only for genuine user toggles. The initial seed from the
  // saved profile applies instantly so the dashboard never appears to collapse
  // on its own during load.
  const swap = busyModeAnimate
    ? { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }
    : { duration: 0 };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {busyMode ? (
        <motion.div
          key="busy"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={swap}
          className="mx-auto max-w-6xl space-y-8"
        >
          <BusyBanner />
          <div className={heroWrap}>
            <GoodMorning />
          </div>
          <div className={heroWrap}>
            <ThingsYouShouldKnowToday />
          </div>
          <WhatChanged />
          <MarketPulse />
        </motion.div>
      ) : (
        <motion.div
          key="full"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={swap}
          className="mx-auto max-w-7xl space-y-8"
        >
          {/* Top: hero + flagship intel (wide left) · changes + markets (right) */}
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <GoodMorning />
              <div className="flex-1">
                <ThingsYouShouldKnowToday />
              </div>
            </div>
            <div className="flex flex-col gap-6 lg:col-span-1">
              <WhatChanged />
              <div className="flex-1">
                <MarketPulse />
              </div>
            </div>
          </div>

          {/* Middle: full-width feed grids */}
          <TechIntelligence />
          <GitHubRadar />

          {/* Lower: personalized rows */}
          <CareerRadar />
          <RecommendedForYou />
          <SocialPulse />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
