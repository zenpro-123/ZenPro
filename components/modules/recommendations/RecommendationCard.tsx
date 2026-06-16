"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, truncate } from "@/lib/utils/formatting";
import { useTrackEvent } from "@/lib/events/useTrackEvent";
import type { ScoredRecommendation } from "@/types/recommendation";

interface RecommendationCardProps {
  recommendation: ScoredRecommendation;
}

/** Single card in "Recommended For You" — fires a view event on mount and a click event on click-through. */
export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { item, reasons } = recommendation;
  const trackEvent = useTrackEvent();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent({ eventType: "card_view", itemId: item.id, properties: { category: item.category } });
  }, [item.id, item.category, trackEvent]);

  function handleClick() {
    trackEvent({ eventType: "recommendation_click", itemId: item.id, properties: { category: item.category } });
  }

  return (
    <GlassCard className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <SourceBadge source={item.source} />
        {item.published_at && (
          <span className="text-xs text-muted-foreground">{formatRelativeTime(item.published_at)}</span>
        )}
      </div>

      <a
        href={item.url ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="group/link flex items-start gap-2"
      >
        <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-foreground transition-colors group-hover/link:text-primary">
          {item.title}
        </h3>
        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary" />
      </a>

      {item.summary && (
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {truncate(item.summary, 140)}
        </p>
      )}

      {reasons.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {reasons.map((reason) => (
            <Badge key={reason} variant="secondary">
              {reason}
            </Badge>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
