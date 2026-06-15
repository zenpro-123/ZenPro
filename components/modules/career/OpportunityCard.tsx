import Image from "next/image";
import { ArrowUpRight, Calendar, MapPin, Wallet } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { AISummaryBlock } from "@/components/shared/AISummaryBlock";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, truncate } from "@/lib/utils/formatting";
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

  return (
    <GlassCard className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {opportunity.imageUrl && (
            <Image
              src={opportunity.imageUrl}
              alt=""
              width={20}
              height={20}
              className="rounded-md"
              unoptimized
            />
          )}
          <span className="text-xs text-muted-foreground">{metadata.company}</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {TYPE_LABELS[metadata.type]}
        </Badge>
      </div>

      <a
        href={opportunity.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-2"
      >
        <h3 className="flex-1 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
          {opportunity.title}
        </h3>
        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      </a>

      {opportunity.summary && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {isDetailed ? opportunity.summary : truncate(opportunity.summary, 140)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {metadata.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {metadata.remote ? `${metadata.location} · Remote` : metadata.location}
          </span>
        )}
        {!metadata.location && metadata.remote && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            Remote
          </span>
        )}
        {metadata.salary && (
          <span className="flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5" />
            {metadata.salary}
          </span>
        )}
        {metadata.deadline && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Deadline {formatRelativeTime(metadata.deadline)}
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
