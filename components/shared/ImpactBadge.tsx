import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DevelopmentImpact } from "@/types/ai";

const IMPACT_CONFIG: Record<DevelopmentImpact, { label: string; className: string }> = {
  high: { label: "High impact", className: "border-primary/20 bg-primary/10 text-primary" },
  medium: { label: "Medium impact", className: "border-warning/20 bg-warning/10 text-warning" },
  low: { label: "Low impact", className: "border-border bg-secondary/60 text-muted-foreground" },
};

interface ImpactBadgeProps {
  impact: DevelopmentImpact;
  className?: string;
}

/** Color-coded impact level used across "Things You Should Know Today" and "What Changed". */
export function ImpactBadge({ impact, className }: ImpactBadgeProps) {
  const config = IMPACT_CONFIG[impact];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
