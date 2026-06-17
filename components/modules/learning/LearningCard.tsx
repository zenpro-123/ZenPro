import Image from "next/image";
import { ArrowUpRight, GraduationCap } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { ReadingTimeBadge } from "@/components/shared/ReadingTimeBadge";
import { CardActions } from "@/components/shared/CardActions";
import { formatRelativeTime, truncate } from "@/lib/utils/formatting";
import { toSaveItemPayload } from "@/lib/content/payload";
import { cn } from "@/lib/utils";
import type { LearningArticle } from "@/types/content";

interface LearningCardProps {
  article: LearningArticle;
  mode: "quick" | "detailed";
}

/** Single Learning Feed card — Quick mode shows a snippet, Detailed shows the full excerpt.
 *  Always renders a fixed-height cover (image or branded placeholder) for uniform tile height. */
export function LearningCard({ article, mode }: LearningCardProps) {
  const isDetailed = mode === "detailed";

  return (
    <GlassCard className="group flex h-full flex-col overflow-hidden p-0">
      {/* Cover — always present for uniform tile height */}
      <div className="relative h-40 w-full shrink-0 overflow-hidden">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="cover-placeholder flex h-full w-full items-center justify-center">
            <GraduationCap className="h-9 w-9 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent opacity-90" />

        <div className="absolute bottom-3 left-3">
          <SourceBadge source={article.source} />
        </div>
        <div className="absolute right-2 top-2 rounded-full bg-background/55 px-0.5 backdrop-blur-md">
          <CardActions item={toSaveItemPayload(article)} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group/link flex items-start gap-2"
        >
          <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-foreground transition-colors group-hover/link:text-primary">
            {article.title}
          </h3>
          <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary" />
        </a>

        {article.summary && (
          <p
            className={cn(
              "text-sm leading-relaxed text-muted-foreground",
              !isDetailed && "line-clamp-3"
            )}
          >
            {isDetailed ? article.summary : truncate(article.summary, 160)}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground/70">
          <span>{formatRelativeTime(article.publishedAt)}</span>
          {article.metadata.readingTimeSeconds && (
            <ReadingTimeBadge seconds={article.metadata.readingTimeSeconds} />
          )}
        </div>
      </div>
    </GlassCard>
  );
}
