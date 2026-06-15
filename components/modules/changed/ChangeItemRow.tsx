"use client";

import { ArrowUpRight, Briefcase, Flame, LineChart, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { TrendBadge, type TrendDirection } from "@/components/shared/TrendBadge";
import { ImpactBadge } from "@/components/shared/ImpactBadge";
import { useTrackEvent } from "@/lib/events/useTrackEvent";
import type { ChangeItem, ChangeType } from "@/types/intelligence";

const TYPE_ICONS: Record<ChangeType, LucideIcon> = {
  new_story: Sparkles,
  rising_repo: TrendingUp,
  new_opportunity: Briefcase,
  market_move: LineChart,
  emerging_trend: Flame,
};

function directionFor(change: ChangeItem): TrendDirection {
  switch (change.type) {
    case "rising_repo":
      return "up";
    case "market_move":
      return change.explanation.includes("moved -") ? "down" : "up";
    default:
      return "new";
  }
}

interface ChangeItemRowProps {
  change: ChangeItem;
}

/** Single row in "What Changed Since Yesterday" — type-coded icon, explanation, and impact/trend badges. */
export function ChangeItemRow({ change }: ChangeItemRowProps) {
  const trackEvent = useTrackEvent();
  const Icon = TYPE_ICONS[change.type];

  function handleClick() {
    trackEvent({ eventType: "change_item_click", properties: { type: change.type, title: change.title } });
  }

  const content = (
    <GlassCard className="flex items-start gap-3 p-4">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-snug">{change.title}</h3>
          {change.url && <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{change.explanation}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <TrendBadge direction={directionFor(change)} />
          <ImpactBadge impact={change.impact} />
        </div>
      </div>
    </GlassCard>
  );

  if (!change.url) return content;

  return (
    <a href={change.url} target="_blank" rel="noopener noreferrer" onClick={handleClick} className="block">
      {content}
    </a>
  );
}
