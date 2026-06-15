import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus, Sparkles } from "lucide-react";

export type TrendDirection = "up" | "down" | "stable" | "new";

const TREND_CONFIG: Record<
  TrendDirection,
  { icon: typeof ArrowUp; label: string; className: string; dot: string }
> = {
  up: {
    icon: ArrowUp,
    label: "Rising",
    className: "text-positive bg-positive/10 border-positive/20",
    dot: "bg-positive",
  },
  down: {
    icon: ArrowDown,
    label: "Falling",
    className: "text-negative bg-negative/10 border-negative/20",
    dot: "bg-negative",
  },
  stable: {
    icon: Minus,
    label: "Stable",
    className: "text-warning bg-warning/10 border-warning/20",
    dot: "bg-warning",
  },
  new: {
    icon: Sparkles,
    label: "New",
    className: "text-primary bg-primary/10 border-primary/20",
    dot: "bg-primary",
  },
};

interface TrendBadgeProps {
  direction: TrendDirection;
  label?: string;
  className?: string;
  showIcon?: boolean;
}

/** 🟢/🟡/🔴 style trend indicator used in Social Pulse, What Changed, Instagram Intel. */
export function TrendBadge({
  direction,
  label,
  className,
  showIcon = true,
}: TrendBadgeProps) {
  const config = TREND_CONFIG[direction];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {showIcon ? (
        <Icon className="h-3 w-3" />
      ) : (
        <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      )}
      {label ?? config.label}
    </span>
  );
}
