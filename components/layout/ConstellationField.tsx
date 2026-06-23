"use client";

import { useEffect, useRef } from "react";

/**
 * Futuristic interactive particle constellation. Drifting glowing nodes are linked
 * by thin lines that fade with distance and form/dissolve as the nodes move; nodes
 * and links brighten near the cursor.
 *
 * The node field spans the **full document height**, so it pans (with parallax) as
 * the page scrolls and reveals different patterns the further down you go. Canvas
 * 2D, token-driven palette, purely decorative. Renders a single static frame for
 * reduced-motion users.
 *
 * Loading stays jitter-free because node management is *incremental*: existing
 * particles keep their positions as the page grows (fonts swapping in, data
 * streaming) and we only add/trim to match the new area — never a full reshuffle.
 * Theme changes recolor the existing field in place instead of rebuilding it.
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

interface Node {
  x: number;
  /** position in field space (0 → fieldHeight), independent of scroll */
  y: number;
  vx: number;
  vy: number;
  /** index into the palette — lets a theme change recolor in place */
  ci: number;
  r: number;
}

const CURSOR_RADIUS = 180;
const PARALLAX = 0.6;

interface ThemeConfig {
  linkDist: number;
  areaPerNode: number;
  maxNodes: number;
  dim: number;
  speed: number;
  nodeScale: number;
  glowScale: number;
  linkAlpha: number;
  bottomFade: boolean;
}

const DARK_CFG: ThemeConfig = {
  linkDist: 150,
  areaPerNode: 18000,
  maxNodes: 1800,
  dim: 1,
  speed: 0.22,
  nodeScale: 1,
  glowScale: 1,
  linkAlpha: 0.42,
  bottomFade: true,
};

const LIGHT_CFG: ThemeConfig = {
  linkDist: 130,
  areaPerNode: 28000,
  maxNodes: 800,
  dim: 0.25,
  speed: 0.12,
  nodeScale: 0.8,
  glowScale: 0.7,
  linkAlpha: 0.25,
  bottomFade: false,
};

interface ConstellationFieldProps {
  isLight?: boolean;
}

export function ConstellationField({ isLight = false }: ConstellationFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimRef = useRef(isLight ? LIGHT_CFG.dim : DARK_CFG.dim);
  const cfgRef = useRef<ThemeConfig>(isLight ? LIGHT_CFG : DARK_CFG);
  const paletteRef = useRef<string[]>([]);

  useEffect(() => {
    const cfg = isLight ? LIGHT_CFG : DARK_CFG;
    dimRef.current = cfg.dim;
    cfgRef.current = cfg;
    const styles = getComputedStyle(document.documentElement);
    paletteRef.current = [
      resolveColor(styles.getPropertyValue("--primary"), "#8b5cf6"),
      resolveColor(styles.getPropertyValue("--chart-2"), "#34d399"),
      resolveColor(styles.getPropertyValue("--chart-5"), "#22d3ee"),
    ];
  }, [isLight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let vw = 0;
    let fieldHeight = 0;
    const nodes: Node[] = [];

    const sizeCanvas = () => {
      vw = window.innerWidth;
      const vh = window.innerHeight;
      canvas.width = Math.floor(vw * dpr);
      canvas.height = Math.floor(vh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const targetCount = () => {
      const cfg = cfgRef.current;
      return Math.min(
        cfg.maxNodes,
        Math.max(40, Math.round((vw * fieldHeight) / cfg.areaPerNode))
      );
    };

    const makeNode = (): Node => {
      const cfg = cfgRef.current;
      const yRaw = Math.random() * fieldHeight;
      const y = cfg.bottomFade
        ? yRaw * Math.pow(Math.random(), 0.35)
        : yRaw;
      return {
        x: Math.random() * vw,
        y,
        vx: (Math.random() - 0.5) * cfg.speed,
        vy: (Math.random() - 0.5) * cfg.speed,
        ci: Math.floor(Math.random() * 3),
        r: (1.1 + Math.random() * 1.6) * cfg.nodeScale,
      };
    };

    // Grow/shrink the field to match the current document, preserving existing
    // node positions so the constellation never "jumps" as the page settles.
    const syncNodes = () => {
      fieldHeight = Math.max(
        document.documentElement.scrollHeight,
        window.innerHeight
      );
      const count = targetCount();
      if (nodes.length < count) {
        for (let i = nodes.length; i < count; i++) nodes.push(makeNode());
      } else if (nodes.length > count) {
        nodes.length = count;
      }
    };

    sizeCanvas();
    syncNodes();

    // re-sync when the viewport or document height changes (debounced)
    let rebuildTimer = 0;
    const scheduleRebuild = () => {
      window.clearTimeout(rebuildTimer);
      rebuildTimer = window.setTimeout(() => {
        sizeCanvas();
        syncNodes();
      }, 150);
    };
    const ro = new ResizeObserver(scheduleRebuild);
    ro.observe(document.body);
    window.addEventListener("resize", scheduleRebuild);

    // pointer (canvas is pointer-events-none, so listen on window)
    const pointer = { x: -9999, y: -9999, active: false };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.x = pointer.y = -9999;
    };
    if (!reduce) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
    }

    const draw = () => {
      const vh = window.innerHeight;
      const offset = window.scrollY * PARALLAX;
      const palette = paletteRef.current;
      const dim = dimRef.current;
      const cfg = cfgRef.current;
      const linkDist = cfg.linkDist;
      ctx.clearRect(0, 0, vw, vh);

      const visible: { n: Node; sy: number }[] = [];
      for (const n of nodes) {
        if (!reduce) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > vw) n.vx *= -1;
          if (n.y < 0 || n.y > fieldHeight) n.vy *= -1;
          n.x = Math.max(0, Math.min(vw, n.x));
          n.y = Math.max(0, Math.min(fieldHeight, n.y));
        }
        const sy = n.y - offset;
        if (sy > -linkDist && sy < vh + linkDist) visible.push({ n, sy });
      }

      for (let i = 0; i < visible.length; i++) {
        const a = visible[i];
        for (let j = i + 1; j < visible.length; j++) {
          const b = visible[j];
          const dx = a.n.x - b.n.x;
          const dy = a.sy - b.sy;
          const dist = Math.hypot(dx, dy);
          if (dist > linkDist) continue;

          let alpha = (1 - dist / linkDist) * cfg.linkAlpha;
          if (pointer.active) {
            const mx = (a.n.x + b.n.x) / 2;
            const my = (a.sy + b.sy) / 2;
            const pd = Math.hypot(mx - pointer.x, my - pointer.y);
            if (pd < CURSOR_RADIUS) alpha += (1 - pd / CURSOR_RADIUS) * 0.5;
          }

          ctx.strokeStyle = `rgba(${palette[a.n.ci]}, ${Math.min(alpha * dim, 0.95)})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.n.x, a.sy);
          ctx.lineTo(b.n.x, b.sy);
          ctx.stroke();
        }
      }

      const gs = cfg.glowScale;
      for (const { n, sy } of visible) {
        const color = palette[n.ci];
        let boost = 0;
        if (pointer.active) {
          const pd = Math.hypot(n.x - pointer.x, sy - pointer.y);
          if (pd < CURSOR_RADIUS) boost = 1 - pd / CURSOR_RADIUS;
        }
        const radius = n.r + boost * 1.8;
        const glowR = radius * 4.5 * gs;
        const glow = ctx.createRadialGradient(n.x, sy, 0, n.x, sy, glowR);
        glow.addColorStop(0, `rgba(${color}, ${(0.6 + boost * 0.4) * dim})`);
        glow.addColorStop(1, `rgba(${color}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, sy, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${color}, ${(0.9 + boost * 0.1) * dim})`;
        ctx.beginPath();
        ctx.arc(n.x, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    let running = true;
    const loop = () => {
      if (!running) return;
      draw();
      raf = requestAnimationFrame(loop);
    };

    if (reduce) {
      draw();
    } else {
      raf = requestAnimationFrame(loop);
    }

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
      ro.disconnect();
      window.removeEventListener("resize", scheduleRebuild);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />;
}
