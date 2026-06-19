import { ArrowUpRight, Clock, Hammer } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectIdea, ProjectDifficulty } from "@/types/opportunity-intel";

const DIFFICULTY_CONFIG: Record<ProjectDifficulty, { label: string; className: string }> = {
  beginner: { label: "Beginner", className: "border-positive/20 bg-positive/10 text-positive" },
  intermediate: { label: "Intermediate", className: "border-warning/20 bg-warning/10 text-warning" },
  advanced: { label: "Advanced", className: "border-negative/20 bg-negative/10 text-negative" },
};

interface ProjectIdeaCardProps {
  idea: ProjectIdea;
  featured?: boolean;
}

/** A project idea tile — used both as the featured hero and grid items. */
export function ProjectIdeaCard({ idea, featured = false }: ProjectIdeaCardProps) {
  const difficulty = DIFFICULTY_CONFIG[idea.difficulty];

  return (
    <GlassCard
      strong={featured}
      className={cn("flex h-full flex-col gap-3", featured ? "p-6 sm:p-8" : "p-5")}
    >
      <div className="flex flex-wrap items-center gap-2">
        {featured && (
          <span className="ring-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-chart-2/15 text-primary">
            <Hammer className="h-4 w-4" />
          </span>
        )}
        <Badge variant="outline" className={cn(difficulty.className)}>
          {difficulty.label}
        </Badge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {idea.estimatedDuration}
        </span>
        {featured && (
          <Badge variant="secondary" className="ml-auto">
            Featured
          </Badge>
        )}
      </div>

      <h3
        className={cn(
          "font-heading font-semibold leading-tight tracking-tight text-balance",
          featured ? "text-xl sm:text-2xl" : "text-base"
        )}
      >
        {idea.title}
      </h3>

      <p
        className={cn(
          "leading-relaxed text-muted-foreground",
          featured ? "text-sm" : "line-clamp-3 text-sm"
        )}
      >
        {idea.rationale}
      </p>

      <div className="space-y-2 pt-0.5">
        <span className="text-xs text-muted-foreground/70">Suggested stack</span>
        <div className="flex flex-wrap gap-1.5">
          {idea.suggestedStack.map((tech) => (
            <Badge key={tech} variant="secondary">
              {tech}
            </Badge>
          ))}
        </div>
      </div>

      {idea.inspiration.length > 0 && (
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground/80">
          <span className="text-muted-foreground/70">Why now:</span>
          {idea.inspiration.map((insp) =>
            insp.url ? (
              <a
                key={`${insp.type}-${insp.name}`}
                href={insp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/insp inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                {insp.name}
                <ArrowUpRight className="h-3 w-3" />
              </a>
            ) : (
              <span
                key={`${insp.type}-${insp.name}`}
                className="rounded-full bg-secondary/60 px-2 py-0.5"
              >
                {insp.name}
              </span>
            )
          )}
        </div>
      )}
    </GlassCard>
  );
}
