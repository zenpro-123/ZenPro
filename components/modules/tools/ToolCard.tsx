import { ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { CardActions } from "@/components/shared/CardActions";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/formatting";
import { toSaveItemPayload } from "@/lib/content/payload";
import type { Tool, ToolCategory } from "@/types/content";

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  ai: "AI",
  developer: "Developer",
  design: "Design",
  productivity: "Productivity",
  marketing: "Marketing",
  other: "Other",
};

interface ToolCardProps {
  tool: Tool;
}

/** Single Tool Spotlight card — text-forward (Product Hunt's feed carries no imagery). */
export function ToolCard({ tool }: ToolCardProps) {
  return (
    <GlassCard className="group flex h-full flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SourceBadge source={tool.source} />
          <Badge variant="secondary">{CATEGORY_LABELS[tool.metadata.toolCategory]}</Badge>
        </div>
        <CardActions item={toSaveItemPayload(tool)} />
      </div>

      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group/link flex items-start gap-2"
      >
        <h3 className="line-clamp-2 flex-1 text-base font-semibold leading-snug text-foreground transition-colors group-hover/link:text-primary">
          {tool.title}
        </h3>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary" />
      </a>

      {tool.summary && (
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{tool.summary}</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground/70">
        <span>{formatRelativeTime(tool.publishedAt)}</span>
        {tool.author && <span className="truncate">by {tool.author}</span>}
      </div>
    </GlassCard>
  );
}
