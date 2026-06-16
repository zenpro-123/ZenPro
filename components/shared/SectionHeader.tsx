import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  /** Required section title — rendered in the display (grotesk) font. */
  title: string;
  /** Optional uppercase kicker above the title. */
  eyebrow?: string;
  /** Optional one-line description below the title. */
  subtitle?: string;
  /** Optional leading icon, shown in a tinted gradient tile. */
  icon?: LucideIcon;
  /** Optional controls rendered on the right (filters, tabs, etc.). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Standardized premium section header used across dashboard modules: an optional
 * gradient icon tile + eyebrow, a display-font title, a muted subtitle, and a
 * right-aligned actions slot. Keeps every module visually consistent.
 */
export function SectionHeader({
  title,
  eyebrow,
  subtitle,
  icon: Icon,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="ring-gradient mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-chart-2/15 text-primary">
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2
            className={cn(
              "font-heading text-xl font-semibold tracking-tight text-balance sm:text-2xl",
              eyebrow && "mt-1.5"
            )}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
