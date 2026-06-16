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
  c: string;
  r: number;
}

const LINK_DIST = 150; // px within which nodes connect
const CURSOR_RADIUS = 180; // px pointer influence radius
const PARALLAX = 0.6; // background scrolls slower than content for depth
const AREA_PER_NODE = 10000; // smaller → denser field (≈ one node per this many px²)
const MAX_NODES = 3200; // safety cap for extremely tall pages

export function ConstellationField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const styles = getComputedStyle(document.documentElement);
    const palette = [
      resolveColor(styles.getPropertyValue("--primary"), "#8b5cf6"),
      resolveColor(styles.getPropertyValue("--chart-2"), "#34d399"),
      resolveColor(styles.getPropertyValue("--chart-5"), "#22d3ee"),
    ];

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let vw = 0;
    let fieldHeight = 0;
    let nodes: Node[] = [];

    const sizeCanvas = () => {
      vw = window.innerWidth;
      const vh = window.innerHeight;
      canvas.width = Math.floor(vw * dpr);
      canvas.height = Math.floor(vh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const buildNodes = () => {
      // field spans the whole document so it pans through new patterns on scroll
      fieldHeight = Math.max(
        document.documentElement.scrollHeight,
        window.innerHeight
      );
      const count = Math.min(
        MAX_NODES,
        Math.max(80, Math.round((vw * fieldHeight) / AREA_PER_NODE))
      );
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * vw,
        y: Math.random() * fieldHeight,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        c: palette[Math.floor(Math.random() * palette.length)],
        r: 1.1 + Math.random() * 1.6,
      }));
    };

    sizeCanvas();
    buildNodes();

    // rebuild when the viewport or document height changes (debounced)
    let rebuildTimer = 0;
    const scheduleRebuild = () => {
      window.clearTimeout(rebuildTimer);
      rebuildTimer = window.setTimeout(() => {
        sizeCanvas();
        // only reshuffle if the field height changed meaningfully
        const newH = Math.max(document.documentElement.scrollHeight, window.innerHeight);
        if (Math.abs(newH - fieldHeight) > 80 || nodes.length === 0) buildNodes();
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
      ctx.clearRect(0, 0, vw, vh);

      // advance positions + collect the nodes currently on-screen
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
        if (sy > -LINK_DIST && sy < vh + LINK_DIST) visible.push({ n, sy });
      }

      // links among visible nodes (bounded by viewport, not page length)
      for (let i = 0; i < visible.length; i++) {
        const a = visible[i];
        for (let j = i + 1; j < visible.length; j++) {
          const b = visible[j];
          const dx = a.n.x - b.n.x;
          const dy = a.sy - b.sy;
          const dist = Math.hypot(dx, dy);
          if (dist > LINK_DIST) continue;

          let alpha = (1 - dist / LINK_DIST) * 0.42;
          if (pointer.active) {
            const mx = (a.n.x + b.n.x) / 2;
            const my = (a.sy + b.sy) / 2;
            const pd = Math.hypot(mx - pointer.x, my - pointer.y);
            if (pd < CURSOR_RADIUS) alpha += (1 - pd / CURSOR_RADIUS) * 0.5;
          }

          ctx.strokeStyle = `rgba(${a.n.c}, ${Math.min(alpha, 0.95)})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.n.x, a.sy);
          ctx.lineTo(b.n.x, b.sy);
          ctx.stroke();
        }
      }

      // glowing nodes
      for (const { n, sy } of visible) {
        let boost = 0;
        if (pointer.active) {
          const pd = Math.hypot(n.x - pointer.x, sy - pointer.y);
          if (pd < CURSOR_RADIUS) boost = 1 - pd / CURSOR_RADIUS;
        }
        const radius = n.r + boost * 1.8;
        const glow = ctx.createRadialGradient(n.x, sy, 0, n.x, sy, radius * 4.5);
        glow.addColorStop(0, `rgba(${n.c}, ${0.6 + boost * 0.4})`);
        glow.addColorStop(1, `rgba(${n.c}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, sy, radius * 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${n.c}, ${0.9 + boost * 0.1})`;
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
