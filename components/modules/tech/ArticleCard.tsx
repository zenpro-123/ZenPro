import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { ReadingTimeBadge } from "@/components/shared/ReadingTimeBadge";
import { AISummaryBlock } from "@/components/shared/AISummaryBlock";
import { CardActions } from "@/components/shared/CardActions";
import { formatRelativeTime, truncate } from "@/lib/utils/formatting";
import { toSaveItemPayload } from "@/lib/content/payload";
import type { TechArticle } from "@/types/content";

interface ArticleCardProps {
  article: TechArticle;
  mode: "quick" | "detailed";
}

/** Single tech article card — Quick mode shows a snippet, Detailed adds the AI insight block. */
export function ArticleCard({ article, mode }: ArticleCardProps) {
  const isDetailed = mode === "detailed";

  return (
    <GlassCard className="flex flex-col overflow-hidden">
      {article.imageUrl && (
        <div className="relative h-36 w-full overflow-hidden">
          <Image src={article.imageUrl} alt="" fill className="object-cover" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SourceBadge source={article.source} />
            {article.metadata.readingTimeSeconds && (
              <ReadingTimeBadge seconds={article.metadata.readingTimeSeconds} />
            )}
          </div>
          <CardActions item={toSaveItemPayload(article)} />
        </div>

        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-2"
        >
          <h3 className="flex-1 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
            {article.title}
          </h3>
          <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </a>

        {article.summary && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {isDetailed ? article.summary : truncate(article.summary, 140)}
          </p>
        )}

        {isDetailed && (article.aiSummary || article.aiInsights) && (
          <AISummaryBlock summary={article.aiSummary} insights={article.aiInsights} defaultOpen />
        )}

        <p className="mt-auto text-xs text-muted-foreground/70">
          {formatRelativeTime(article.publishedAt)}
        </p>
      </div>
    </GlassCard>
  );
}
