import Image from "next/image";
import { ArrowUpRight, GitFork, Star, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { AISummaryBlock } from "@/components/shared/AISummaryBlock";
import { CardActions } from "@/components/shared/CardActions";
import { Badge } from "@/components/ui/badge";
import { formatCompactNumber, formatRelativeTime, truncate } from "@/lib/utils/formatting";
import { toSaveItemPayload } from "@/lib/content/payload";
import type { GitHubRepo } from "@/types/content";

interface RepoCardProps {
  repo: GitHubRepo;
  mode: "quick" | "detailed";
}

/** Single trending repo card — Quick mode shows the essentials, Detailed adds the AI insight block. */
export function RepoCard({ repo, mode }: RepoCardProps) {
  const isDetailed = mode === "detailed";
  const [owner, name] = repo.title.split("/");

  return (
    <GlassCard className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {repo.metadata.ownerAvatar && (
            <Image
              src={repo.metadata.ownerAvatar}
              alt=""
              width={20}
              height={20}
              className="rounded-full"
              unoptimized
            />
          )}
          <span className="text-xs text-muted-foreground">{owner}</span>
        </div>
        <div className="flex items-center gap-2">
          {repo.metadata.language && (
            <Badge variant="secondary" className="text-xs">
              {repo.metadata.language}
            </Badge>
          )}
          <CardActions item={toSaveItemPayload(repo)} />
        </div>
      </div>

      <a
        href={repo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-2"
      >
        <h3 className="flex-1 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
          {name}
        </h3>
        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      </a>

      {repo.summary && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {isDetailed ? repo.summary : truncate(repo.summary, 120)}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5" />
          {formatCompactNumber(repo.metadata.stars)}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="h-3.5 w-3.5" />
          {formatCompactNumber(repo.metadata.forks)}
        </span>
        <span className="flex items-center gap-1 text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" />
          ~{formatCompactNumber(repo.metadata.starsToday)}/day
        </span>
      </div>

      {isDetailed && (repo.aiSummary || repo.aiInsights) && (
        <AISummaryBlock summary={repo.aiSummary} insights={repo.aiInsights} defaultOpen />
      )}

      <p className="mt-auto text-xs text-muted-foreground/70">
        Created {formatRelativeTime(repo.publishedAt)}
      </p>
    </GlassCard>
  );
}
