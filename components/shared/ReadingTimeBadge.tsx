import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadingTimeBadgeProps {
  /** Reading time in seconds. */
  seconds: number;
  className?: string;
}

/** Compact "X sec read" / "X min read" indicator. */
export function ReadingTimeBadge({ seconds, className }: ReadingTimeBadgeProps) {
  const label =
    seconds < 60
      ? `${Math.max(5, Math.round(seconds / 5) * 5)} sec read`
      : `${Math.round(seconds / 60)} min read`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground",
        className
      )}
    >
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}

/** Estimate reading time (seconds) from word count, ~225 wpm. */
export function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(15, Math.round((words / 225) * 60));
}
