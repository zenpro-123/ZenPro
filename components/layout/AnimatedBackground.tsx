"use client";

import { useTheme } from "next-themes";
import { ConstellationField } from "@/components/layout/ConstellationField";
import { WaveField } from "@/components/layout/WaveField";
import { useMounted } from "@/lib/hooks/useMounted";
import { cn } from "@/lib/utils";

export function AnimatedBackground() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  // Gate BOTH atmospheres on `mounted` so neither shows before next-themes
  // resolves — otherwise a light-mode user gets a dark-atmosphere flash on load
  // (the `.dark` class is set pre-paint, so bg-background is already correct).
  const isLight = mounted && resolvedTheme === "light";
  const isDark = mounted && resolvedTheme !== "light";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Dark atmosphere — depth mesh + aurora */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700 ease-out",
          isDark ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="bg-mesh-base absolute inset-0" />
        <div className="bg-aurora absolute inset-0 opacity-60" />
      </div>

      {/* Light atmosphere — rippling teal wave lines */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700 ease-out",
          isLight ? "opacity-100" : "opacity-0"
        )}
      >
        {isLight && <WaveField />}
      </div>

      {/* Constellation network — dark mode only */}
      {isDark && <ConstellationField isLight={false} />}

      {/* matte film grain — dark only */}
      <div className={cn("grain absolute inset-0 transition-opacity duration-700", isDark ? "opacity-100" : "opacity-0")} />

      {/* subtle vignette — dark only */}
      <div
        className={cn("absolute inset-0 transition-opacity duration-700", isDark ? "opacity-100" : "opacity-0")}
        style={{ backgroundImage: "radial-gradient(ellipse at center, transparent 45%, color-mix(in oklch, var(--background) 80%, transparent) 100%)" }}
      />
    </div>
  );
}
