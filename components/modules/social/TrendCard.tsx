import { ArrowUpRight, Minus, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { cn } from "@/lib/utils";
import { formatCompactNumber, formatRelativeTime } from "@/lib/utils/formatting";
import type { SocialTrend } from "@/types/content";

const DIRECTION_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
  new: Sparkles,
} as const;

const DIRECTION_COLOR = {
  up: "text-emerald-400",
  down: "text-rose-400",
  stable: "text-muted-foreground",
  new: "text-primary",
} as const;

const PLATFORM_LABEL = {
  x: "X",
  instagram: "Instagram",
  reddit: "Reddit",
  youtube: "YouTube",
} as const;

interface TrendCardProps {
  trend: SocialTrend;
}

/** Single trending topic card for Social Pulse (Module 7). */
export function TrendCard({ trend }: TrendCardProps) {
  const { metadata } = trend;
  const Icon = DIRECTION_ICON[metadata.trendDirection];

  return (
    <GlassCard className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <SourceBadge source={PLATFORM_LABEL[metadata.platform]} />
        <Icon className={cn("h-3.5 w-3.5", DIRECTION_COLOR[metadata.trendDirection])} />
      </div>

      <a
        href={trend.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-2"
      >
        <h3 className="flex-1 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
          {trend.title}
        </h3>
        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      </a>

      {trend.summary && (
        <p className="text-sm leading-relaxed text-muted-foreground">{trend.summary}</p>
      )}

      {metadata.engagementCount !== undefined && (
        <p className="text-xs text-muted-foreground">
          {formatCompactNumber(metadata.engagementCount)} engagements
        </p>
      )}

      <p className="mt-auto text-xs text-muted-foreground/70">
        {formatRelativeTime(trend.publishedAt)}
      </p>
    </GlassCard>
  );
}
