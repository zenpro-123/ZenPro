import { GlassCard } from "@/components/shared/GlassCard";
import { TrendBadge } from "@/components/shared/TrendBadge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SkillEntry, SkillCategory, SkillSource } from "@/types/opportunity-intel";

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  language: "Language",
  framework: "Framework",
  database: "Database",
  cloud: "Cloud",
  ai: "AI",
  devops: "DevOps",
  tool: "Tool",
};

const SOURCE_LABELS: Record<SkillSource, string> = {
  career: "Jobs",
  github: "Repos",
  learning: "Learning",
  tech: "Articles",
  tools: "Tools",
};

interface SkillCardProps {
  skill: SkillEntry;
}

/** A single skill tile on the Skill Demand Radar. */
export function SkillCard({ skill }: SkillCardProps) {
  return (
    <GlassCard className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold leading-snug text-foreground">
            {skill.name}
          </h3>
          <Badge variant="secondary" className="mt-1">
            {CATEGORY_LABELS[skill.category]}
          </Badge>
        </div>
        <TrendBadge
          direction={skill.trend}
          label={
            skill.trend === "up" || skill.trend === "down"
              ? `${skill.growthPercent > 0 ? "+" : ""}${skill.growthPercent}%`
              : undefined
          }
        />
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tabular-nums">{skill.count}</span>
        <span className="text-xs text-muted-foreground">mentions</span>
      </div>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
        <span className="text-xs text-muted-foreground/70">Appears in:</span>
        {skill.sources.map((source) => (
          <span
            key={source}
            className={cn(
              "rounded-full bg-secondary/60 px-2 py-0.5 text-xs font-medium text-muted-foreground"
            )}
          >
            {SOURCE_LABELS[source]}
          </span>
        ))}
      </div>
    </GlassCard>
  );
}
