import { ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { ArticleCover } from "@/components/shared/ArticleCover";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { ReadingTimeBadge } from "@/components/shared/ReadingTimeBadge";
import { AISummaryBlock } from "@/components/shared/AISummaryBlock";
import { CardActions } from "@/components/shared/CardActions";
import { formatRelativeTime, truncate } from "@/lib/utils/formatting";
import { toSaveItemPayload } from "@/lib/content/payload";
import { cn } from "@/lib/utils";
import type { TechArticle } from "@/types/content";

interface ArticleCardProps {
  article: TechArticle;
  mode: "quick" | "detailed";
}

/** Single tech article card — Quick mode shows a snippet, Detailed adds the AI insight block.
 *  Always renders a fixed-height cover (image or branded placeholder) so every tile is equal height. */
export function ArticleCard({ article, mode }: ArticleCardProps) {
  const isDetailed = mode === "detailed";

  return (
    <GlassCard className="group flex h-full flex-col overflow-hidden p-0">
      {/* Cover — always present for uniform tile height */}
      <div className="relative h-40 w-full shrink-0 overflow-hidden">
        <ArticleCover
          imageUrl={article.imageUrl}
          url={article.url}
          title={article.title}
          category={article.category}
        />
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

        {isDetailed && (article.aiSummary || article.aiInsights) && (
          <AISummaryBlock summary={article.aiSummary} insights={article.aiInsights} defaultOpen />
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
