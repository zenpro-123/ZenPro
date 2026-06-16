import Image from "next/image";
import { ArrowUpRight, Calendar, MapPin, Wallet } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { AISummaryBlock } from "@/components/shared/AISummaryBlock";
import { CardActions } from "@/components/shared/CardActions";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, truncate } from "@/lib/utils/formatting";
import { toSaveItemPayload } from "@/lib/content/payload";
import { cn } from "@/lib/utils";
import type { CareerOpportunity } from "@/types/content";

interface OpportunityCardProps {
  opportunity: CareerOpportunity;
  mode: "quick" | "detailed";
}

const TYPE_LABELS: Record<CareerOpportunity["metadata"]["type"], string> = {
  job: "Job",
  internship: "Internship",
  hackathon: "Hackathon",
  scholarship: "Scholarship",
  fellowship: "Fellowship",
  accelerator: "Accelerator",
  competition: "Competition",
};

/** Single career opportunity card — Quick mode shows the essentials, Detailed adds the AI insight block. */
export function OpportunityCard({ opportunity, mode }: OpportunityCardProps) {
  const isDetailed = mode === "detailed";
  const { metadata } = opportunity;

  const metaChip = "inline-flex items-center gap-1 rounded-md bg-secondary/40 px-2 py-1 text-muted-foreground";

  return (
    <GlassCard className="group flex h-full flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {opportunity.imageUrl && (
            <Image
              src={opportunity.imageUrl}
              alt=""
              width={22}
              height={22}
              className="rounded-md ring-1 ring-white/10"
              unoptimized
            />
          )}
          <span className="truncate text-xs text-muted-foreground">{metadata.company}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {TYPE_LABELS[metadata.type]}
          </Badge>
          <CardActions item={toSaveItemPayload(opportunity)} />
        </div>
      </div>

      <a
        href={opportunity.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group/link flex items-start gap-2"
      >
        <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-foreground transition-colors group-hover/link:text-primary">
          {opportunity.title}
        </h3>
        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary" />
      </a>

      {opportunity.summary && (
        <p
          className={cn(
            "text-sm leading-relaxed text-muted-foreground",
            !isDetailed && "line-clamp-2"
          )}
        >
          {isDetailed ? opportunity.summary : truncate(opportunity.summary, 140)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {(metadata.location || metadata.remote) && (
          <span className={metaChip}>
            <MapPin className="h-3.5 w-3.5" />
            {metadata.location
              ? metadata.remote
                ? `${metadata.location} · Remote`
                : metadata.location
              : "Remote"}
          </span>
        )}
        {metadata.salary && (
          <span className={metaChip}>
            <Wallet className="h-3.5 w-3.5" />
            {metadata.salary}
          </span>
        )}
        {metadata.deadline && (
          <span className={cn(metaChip, "bg-warning/10 text-warning")}>
            <Calendar className="h-3.5 w-3.5" />
            {formatRelativeTime(metadata.deadline)}
          </span>
        )}
      </div>

      {isDetailed && (opportunity.aiSummary || opportunity.aiInsights) && (
        <AISummaryBlock summary={opportunity.aiSummary} insights={opportunity.aiInsights} defaultOpen />
      )}

      <p className="mt-auto text-xs text-muted-foreground/70">
        Posted {formatRelativeTime(opportunity.publishedAt)}
      </p>
    </GlassCard>
  );
}
