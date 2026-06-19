"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils/formatting";
import { useTrackEvent } from "@/lib/events/useTrackEvent";
import type { SnapshotOpportunity } from "@/types/intelligence";

interface OpportunityDiscoveryCardProps {
  opportunity: SnapshotOpportunity;
}

/** A discoverable opportunity with a one-click "Track" into the Placement CRM. */
export function OpportunityDiscoveryCard({ opportunity }: OpportunityDiscoveryCardProps) {
  const queryClient = useQueryClient();
  const trackEvent = useTrackEvent();
  const [tracked, setTracked] = useState(false);

  const track = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: opportunity.title,
          company: opportunity.company,
          url: opportunity.url,
          opportunityType: opportunity.type,
          status: "interested",
        }),
      });
      if (!res.ok) throw new Error("Failed to track opportunity");
      return res.json();
    },
    onSuccess: () => {
      setTracked(true);
      trackEvent({ eventType: "item_save", itemId: opportunity.id });
      queryClient.invalidateQueries({ queryKey: ["placement"] });
      queryClient.invalidateQueries({ queryKey: ["opportunity-intel", "opportunities"] });
    },
  });

  return (
    <GlassCard className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="secondary">{opportunity.type}</Badge>
        <Button
          type="button"
          variant={tracked ? "ghost" : "outline"}
          size="sm"
          disabled={tracked || track.isPending}
          onClick={() => track.mutate()}
        >
          {tracked ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Tracked
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Track
            </>
          )}
        </Button>
      </div>

      <a
        href={opportunity.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group/link flex items-start gap-2"
      >
        <h3 className="line-clamp-2 flex-1 text-base font-semibold leading-snug text-foreground transition-colors group-hover/link:text-primary">
          {opportunity.title}
        </h3>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary" />
      </a>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground/80">
        <span className="truncate">{opportunity.company}</span>
        <span className="shrink-0">{formatRelativeTime(opportunity.publishedAt)}</span>
      </div>
    </GlassCard>
  );
}
