import { Briefcase, Cpu, LineChart, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { TrendBadge } from "@/components/shared/TrendBadge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CareerSignal, SignalType, SignalStrength } from "@/types/opportunity-intel";

const TYPE_CONFIG: Record<SignalType, { label: string; icon: typeof Briefcase }> = {
  hiring_trend: { label: "Hiring Trend", icon: Briefcase },
  skill_demand: { label: "Skill Demand", icon: TrendingUp },
  technology_shift: { label: "Technology Shift", icon: Cpu },
  market_pattern: { label: "Market Pattern", icon: LineChart },
};

const STRENGTH_CONFIG: Record<SignalStrength, { label: string; className: string }> = {
  strong: { label: "Strong", className: "border-primary/20 bg-primary/10 text-primary" },
  moderate: { label: "Moderate", className: "border-warning/20 bg-warning/10 text-warning" },
  emerging: { label: "Emerging", className: "border-border bg-secondary/60 text-muted-foreground" },
};

interface SignalCardProps {
  signal: CareerSignal;
}

/** A single Career Signal — a text-forward intelligence card. */
export function SignalCard({ signal }: SignalCardProps) {
  const typeConfig = TYPE_CONFIG[signal.type];
  const strengthConfig = STRENGTH_CONFIG[signal.strength];
  const Icon = typeConfig.icon;

  return (
    <GlassCard className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="ring-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-chart-2/15 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="flex-1 text-base font-semibold leading-snug tracking-tight">
          {signal.title}
        </h3>
        <Badge variant="outline" className={cn(strengthConfig.className)}>
          {strengthConfig.label}
        </Badge>
        <TrendBadge direction={signal.trend} showIcon={false} />
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{signal.description}</p>

      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <Badge variant="secondary">{typeConfig.label}</Badge>
        {signal.evidence.map((point) => (
          <span
            key={point}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground/80"
          >
            <span aria-hidden className="h-1 w-1 rounded-full bg-primary/50" />
            {point}
          </span>
        ))}
      </div>
    </GlassCard>
  );
}
