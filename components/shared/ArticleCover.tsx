"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Briefcase,
  Cpu,
  GraduationCap,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentCategory } from "@/types/content";

/**
 * Card cover with a graceful fallback hierarchy so no tile is ever a blank box:
 *
 *   1. Article image (the RSS/OG thumbnail the provider resolved).
 *   2. — (OG-image fetch is collapsed into 1; feeds already surface the OG image.)
 *   3. The source's favicon/logo, centered on a branded gradient.
 *   4. A curated, category-specific ZenPro placeholder (gradient + glyph).
 *
 * Steps degrade automatically on load error (broken/blocked images), which is the
 * common cause of "missing thumbnails". Free and deterministic — favicons come
 * from Google's public s2 endpoint; placeholders are pure CSS.
 */

type CoverTheme = "technology" | "careers" | "markets" | "learning";

const CATEGORY_THEME: Record<ContentCategory, CoverTheme> = {
  tech: "technology",
  github: "technology",
  tools: "technology",
  startup: "technology",
  creator: "technology",
  social: "technology",
  x: "technology",
  instagram: "technology",
  career: "careers",
  market: "markets",
  learning: "learning",
};

const THEME_META: Record<CoverTheme, { icon: LucideIcon; cover: string }> = {
  technology: { icon: Cpu, cover: "cover-tech" },
  careers: { icon: Briefcase, cover: "cover-careers" },
  markets: { icon: LineChart, cover: "cover-markets" },
  learning: { icon: GraduationCap, cover: "cover-learning" },
};

/** Public favicon endpoint (no key) for the article's source domain. */
function faviconFor(url?: string): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  } catch {
    return null;
  }
}

interface ArticleCoverProps {
  imageUrl?: string;
  url?: string;
  title: string;
  category?: ContentCategory;
}

export function ArticleCover({ imageUrl, url, title, category = "tech" }: ArticleCoverProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [favFailed, setFavFailed] = useState(false);

  const { icon: Icon, cover } = THEME_META[CATEGORY_THEME[category]];
  const favicon = faviconFor(url);

  // 1/2 — article (OG) image
  if (imageUrl && !imgFailed) {
    return (
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        onError={() => setImgFailed(true)}
      />
    );
  }

  // 3/4 — branded category placeholder, with the source favicon as the centerpiece
  // when we have one (otherwise a category glyph).
  return (
    <div className={cn("flex h-full w-full items-center justify-center", cover)}>
      {favicon && !favFailed ? (
        <Image
          src={favicon}
          alt=""
          width={44}
          height={44}
          unoptimized
          className="h-11 w-11 rounded-xl opacity-90 shadow-sm"
          onError={() => setFavFailed(true)}
        />
      ) : (
        <Icon className="h-9 w-9 text-primary/40" />
      )}
    </div>
  );
}
