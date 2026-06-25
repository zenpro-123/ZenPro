"use client";

import { ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { ImpactBadge } from "@/components/shared/ImpactBadge";
import { CardActions } from "@/components/shared/CardActions";
import { useTrackEvent } from "@/lib/events/useTrackEvent";
import type { TopDevelopment } from "@/types/ai";
import type { SaveItemPayload } from "@/types/saved";

interface TopDevelopmentCardProps {
  development: TopDevelopment;
  index: number;
}

/** Single entry in "Things You Should Know Today" — what happened, why it matters, what's next. */
export function TopDevelopmentCard({ development, index }: TopDevelopmentCardProps) {
  const trackEvent = useTrackEvent();

  function handleClick() {
    trackEvent({
      eventType: "development_click",
      itemId: development.id,
      properties: { category: development.category },
    });
  }

  const savePayload: SaveItemPayload = {
    contentHash: development.id,
    source: development.source,
    category: development.category,
    title: development.title,
    url: development.sourceUrl,
  };

  return (
    <GlassCard className="overflow-hidden p-0">
      {development.imageUrl && (
        <div className="relative h-36 w-full overflow-hidden sm:h-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={development.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget.parentElement as HTMLElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
        </div>
      )}
      <div className="flex items-start gap-3 p-4">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {index + 1}
        </span>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium leading-snug">{development.title}</h3>
            <div className="flex shrink-0 items-center gap-0.5">
              <CardActions item={savePayload} />
              {development.sourceUrl && (
                <a
                  href={development.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClick}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
          {development.whatHappened && development.whatHappened !== development.title && (
            <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">{development.whatHappened}</p>
          )}
          <p className="text-xs text-foreground/70">
            <span className="font-medium text-primary">Why it matters: </span>
            {development.whyItMatters}
          </p>
          <p className="text-xs text-foreground/70">
            <span className="font-medium text-primary">What&apos;s next: </span>
            {development.implications}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <SourceBadge source={development.source} />
            <ImpactBadge impact={development.impact} />
            {development.relatedSources?.map((source) => (
              <SourceBadge key={source} source={source} />
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
