"use client";

import { useEffect, useRef } from "react";

/**
 * Light-mode decorative backdrop: many thin parallel lines that ripple across the
 * viewport like a flowing waveform. Each row is a polyline whose vertical offset
 * is the sum of two travelling sine waves; advancing the phase each frame makes
 * the whole field ripple. Canvas 2D, token-driven palette, purely decorative.
 * Renders a single static frame for reduced-motion users.
 */

/** Resolve a CSS color (incl. oklch()) to an "r,g,b" string via a 1×1 canvas. */
function resolveColor(raw: string, fallback: string): string {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const ctx = c.getContext("2d");
  if (!ctx) return fallback;
  ctx.fillStyle = fallback;
  ctx.fillStyle = raw.trim() || fallback;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `${r}, ${g}, ${b}`;
}

const ROW_GAP = 24; // px between wave lines
const STEP = 10; // px between sampled points along a line
const AMP1 = 11; // primary wave amplitude
const AMP2 = 5.5; // secondary wave amplitude
const K1 = (Math.PI * 2) / 520; // primary wavelength
const K2 = (Math.PI * 2) / 230; // secondary wavelength
const SPEED = 0.014; // phase advance per frame

export function WaveField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteRef = useRef<string[]>([]);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    paletteRef.current = [
      resolveColor(styles.getPropertyValue("--primary"), "#22b8c0"),
      resolveColor(styles.getPropertyValue("--chart-2"), "#16a34a"),
    ];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let vw = 0;
    let vh = 0;
    let t = 0;

    const size = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width = Math.floor(vw * dpr);
      canvas.height = Math.floor(vh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    let rebuildTimer = 0;
    const scheduleResize = () => {
      window.clearTimeout(rebuildTimer);
      rebuildTimer = window.setTimeout(size, 200);
    };
    window.addEventListener("resize", scheduleResize);

    const draw = () => {
      ctx.clearRect(0, 0, vw, vh);
      const [primary, accent] = paletteRef.current;
      const rows = Math.ceil(vh / ROW_GAP) + 1;

      for (let r = 0; r < rows; r++) {
        const baseY = r * ROW_GAP;
        // Fade toward the vertical centre so the content band stays calm.
        const centreDist = Math.abs(baseY - vh / 2) / (vh / 2); // 0 centre → 1 edge
        const alpha = 0.08 + centreDist * 0.17;
        const everyFifth = r % 5 === 0;
        ctx.strokeStyle = `rgba(${everyFifth ? accent : primary}, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = -STEP; x <= vw + STEP; x += STEP) {
          const y =
            baseY +
            AMP1 * Math.sin(K1 * x + t + r * 0.18) +
            AMP2 * Math.sin(K2 * x - t * 0.7 + r * 0.05);
          if (x === -STEP) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      if (!reduce) t += SPEED;
    };

    let raf = 0;
    let running = true;
    const loop = () => {
      if (!running) return;
      draw();
      raf = requestAnimationFrame(loop);
    };
    if (reduce) draw();
    else raf = requestAnimationFrame(loop);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running && !reduce) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(rebuildTimer);
      window.removeEventListener("resize", scheduleResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />;
}
