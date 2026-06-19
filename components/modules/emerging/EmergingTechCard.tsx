import { GlassCard } from "@/components/shared/GlassCard";
import { TrendBadge } from "@/components/shared/TrendBadge";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { EmergingTech, SkillSource } from "@/types/opportunity-intel";

const SOURCE_LABELS: Record<SkillSource, string> = {
  career: "Jobs",
  github: "Repos",
  learning: "Learning",
  tech: "Articles",
  tools: "Tools",
};

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "Very High";
  if (confidence >= 0.6) return "High";
  if (confidence >= 0.4) return "Moderate";
  return "Early";
}

interface EmergingTechCardProps {
  tech: EmergingTech;
}

/** A single emerging-technology tile with a cross-source confidence breakdown. */
export function EmergingTechCard({ tech }: EmergingTechCardProps) {
  const confidencePct = Math.round(tech.confidence * 100);

  return (
    <GlassCard className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug text-foreground">{tech.name}</h3>
        <TrendBadge direction={tech.trend} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-medium text-foreground">{confidenceLabel(tech.confidence)}</span>
        </div>
        <Progress value={confidencePct} className="h-1.5" />
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{tech.description}</p>

      <div className="mt-auto space-y-1.5 pt-1">
        <span className="text-xs text-muted-foreground/70">Appears in</span>
        <div className="flex flex-wrap gap-1.5">
          {tech.sources.map((source) => (
            <Badge key={source.category} variant="secondary">
              {SOURCE_LABELS[source.category]}
              <span className="text-muted-foreground/70">{source.count}</span>
            </Badge>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
