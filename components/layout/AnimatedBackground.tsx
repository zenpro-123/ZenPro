"use client";

import { useTheme } from "next-themes";
import { ConstellationField } from "@/components/layout/ConstellationField";
import { useMounted } from "@/lib/hooks/useMounted";
import { cn } from "@/lib/utils";

export function AnimatedBackground() {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const isLight = mounted && resolvedTheme === "light";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Dark atmosphere — depth mesh + aurora */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700 ease-out",
          isLight ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="bg-mesh-base absolute inset-0" />
        <div className="bg-aurora absolute inset-0 opacity-60" />
      </div>

      {/* Light atmosphere — futuristic dot matrix + drifting spotlight */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700 ease-out",
          isLight ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="bg-dot-grid absolute inset-0" />
        <div
          className="glow-pool absolute left-[5%] top-0 h-[70vh] w-[70vh]"
          style={{ animation: "glow-drift-1 26s ease-in-out infinite", willChange: "transform" }}
        />
        <div
          className="glow-pool absolute right-[8%] top-[20%] h-[55vh] w-[55vh]"
          style={{ animation: "glow-drift-2 32s ease-in-out infinite", willChange: "transform" }}
        />
      </div>

      {/* Constellation network — dark mode only */}
      {!isLight && <ConstellationField isLight={false} />}

      {/* matte film grain — dark only */}
      <div className={cn("grain absolute inset-0 transition-opacity duration-700", isLight ? "opacity-0" : "opacity-100")} />

      {/* subtle vignette — dark only */}
      <div
        className={cn("absolute inset-0 transition-opacity duration-700", isLight ? "opacity-0" : "opacity-100")}
        style={{ backgroundImage: "radial-gradient(ellipse at center, transparent 45%, color-mix(in oklch, var(--background) 80%, transparent) 100%)" }}
      />
    </div>
  );
}
