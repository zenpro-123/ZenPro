import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Use the stronger (more opaque) glass surface for primary content cards. */
  strong?: boolean;
  /** Disable the hover lift/border-glow interaction. */
  static?: boolean;
}

/**
 * The base surface for nearly every card in ZenPro — a glassmorphism panel
 * with a subtle border and backdrop blur, consistent across light/dark.
 */
export function GlassCard({
  className,
  strong = false,
  static: isStatic = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl ring-gradient surface-premium",
        strong ? "glass-strong" : "glass",
        !isStatic && "glass-hover-lift",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
