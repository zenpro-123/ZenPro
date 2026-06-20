import Image from "next/image";
import { ArrowUpRight, GitFork, Star, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { AISummaryBlock } from "@/components/shared/AISummaryBlock";
import { CardActions } from "@/components/shared/CardActions";
import { formatCompactNumber, formatRelativeTime, truncate } from "@/lib/utils/formatting";
import { toSaveItemPayload } from "@/lib/content/payload";
import { cn } from "@/lib/utils";
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
    <GlassCard className="group flex h-full flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {repo.metadata.ownerAvatar && (
            <Image
              src={repo.metadata.ownerAvatar}
              alt={`${owner} avatar`}
              width={20}
              height={20}
              className="rounded-full ring-1 ring-foreground/10"
              unoptimized
            />
          )}
          <span className="truncate text-xs text-muted-foreground">{owner}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {repo.metadata.language && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/50 px-2 py-0.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
              {repo.metadata.language}
            </span>
          )}
          <CardActions item={toSaveItemPayload(repo)} />
        </div>
      </div>

      <a
        href={repo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group/link flex items-start gap-2"
      >
        <h3 className="line-clamp-1 flex-1 text-sm font-semibold leading-snug text-foreground transition-colors group-hover/link:text-primary">
          {name}
        </h3>
        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary" />
      </a>

      {repo.summary && (
        <p
          className={cn(
            "text-sm leading-relaxed text-muted-foreground",
            !isDetailed && "line-clamp-2"
          )}
        >
          {isDetailed ? repo.summary : truncate(repo.summary, 120)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-md bg-secondary/40 px-2 py-1 text-muted-foreground">
          <Star className="h-3.5 w-3.5" />
          {formatCompactNumber(repo.metadata.stars)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-secondary/40 px-2 py-1 text-muted-foreground">
          <GitFork className="h-3.5 w-3.5" />
          {formatCompactNumber(repo.metadata.forks)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-positive/10 px-2 py-1 text-positive">
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
