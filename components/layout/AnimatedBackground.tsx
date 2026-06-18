"use client";

import { useTheme } from "next-themes";
import { ConstellationField } from "@/components/layout/ConstellationField";
import { useMounted } from "@/lib/hooks/useMounted";

/**
 * Full-viewport decorative backdrop. A deep gradient mesh + faint aurora wash give
 * the dark canvas depth; an interactive particle-constellation network drifts on
 * top for a futuristic feel; grain + a vignette finish it with a matte, focused
 * look. Purely decorative — never interactive (the canvas listens to the pointer
 * but doesn't capture events).
 */
export function AnimatedBackground() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const isLight = mounted && resolvedTheme === "light";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* depth + ambient color floor */}
      <div className="bg-mesh-base absolute inset-0" />
      <div className="bg-aurora absolute inset-0 opacity-60" />

      {/* futuristic constellation network — re-resolves its token palette when the
          theme changes (via the isLight effect dep) and softens on a light canvas */}
      <ConstellationField isLight={isLight} />

      {/* matte film grain */}
      <div className="grain absolute inset-0" />

      {/* subtle vignette to keep edges calm and focus the center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,color-mix(in_oklch,var(--background)_80%,transparent)_100%)]" />
    </div>
  );
}
