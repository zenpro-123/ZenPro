/**
 * Feature flags
 * -------------
 * Centralized switches for every module. V1 modules default to `on` and can be
 * disabled via env vars (e.g. for incident response). V2 modules — those that
 * depend on stub providers (X, Instagram), embeddings, or deeper AI pipelines —
 * default to `off` and are hard-disabled here until their dependencies land.
 *
 * Server-only flags read `process.env.FF_*`. Flags consumed by client
 * components must use `NEXT_PUBLIC_FF_*` and are inlined at build time.
 */

export type FeaturePhase = "v1" | "v2" | "v3";

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  phase: FeaturePhase;
}

function flag(envVar: string, defaultValue: boolean): boolean {
  const value = process.env[envVar];
  if (value === undefined) return defaultValue;
  return value !== "false" && value !== "0";
}

export const FEATURES = {
  // --- V1: Foundation + Hero Modules ---
  GOOD_MORNING: {
    key: "GOOD_MORNING",
    enabled: flag("NEXT_PUBLIC_FF_GOOD_MORNING", true),
    description: "AI-generated personalized 'Good Morning' brief",
    phase: "v1",
  },
  THINGS_TO_KNOW: {
    key: "THINGS_TO_KNOW",
    enabled: flag("NEXT_PUBLIC_FF_THINGS_TO_KNOW", true),
    description: "Top 5 developments you should know today",
    phase: "v1",
  },
  TECH_INTELLIGENCE: {
    key: "TECH_INTELLIGENCE",
    enabled: flag("NEXT_PUBLIC_FF_TECH_INTELLIGENCE", true),
    description: "Daily Tech Intelligence (Verge, TechCrunch, GeekWire, HN)",
    phase: "v1",
  },
  GITHUB_RADAR: {
    key: "GITHUB_RADAR",
    enabled: flag("NEXT_PUBLIC_FF_GITHUB_RADAR", true),
    description: "Trending GitHub repositories",
    phase: "v1",
  },
  MARKET_PULSE: {
    key: "MARKET_PULSE",
    enabled: flag("NEXT_PUBLIC_FF_MARKET_PULSE", true),
    description: "Market Pulse (indices, crypto, commodities, forex)",
    phase: "v1",
  },
  CAREER_RADAR: {
    key: "CAREER_RADAR",
    enabled: flag("NEXT_PUBLIC_FF_CAREER_RADAR", true),
    description: "Career opportunities, internships, hackathons",
    phase: "v1",
  },
  COMMAND_CENTER: {
    key: "COMMAND_CENTER",
    enabled: flag("NEXT_PUBLIC_FF_COMMAND_CENTER", true),
    description: "Universal CMD+K search",
    phase: "v1",
  },
  BUSY_MODE: {
    key: "BUSY_MODE",
    enabled: flag("NEXT_PUBLIC_FF_BUSY_MODE", true),
    description: "60-second executive summary toggle",
    phase: "v1",
  },
  SAVED_ITEMS: {
    key: "SAVED_ITEMS",
    enabled: flag("NEXT_PUBLIC_FF_SAVED_ITEMS", true),
    description: "Save for Later / collections",
    phase: "v1",
  },

  // --- V2: Deferred ---
  EMBEDDINGS: {
    key: "EMBEDDINGS",
    enabled: false,
    description: "Content embeddings for personalization & recommendations",
    phase: "v2",
  },
  SOCIAL_PULSE: {
    key: "SOCIAL_PULSE",
    enabled: flag("NEXT_PUBLIC_FF_SOCIAL_PULSE", false),
    description: "Aggregated social trends (X, Instagram, YouTube)",
    phase: "v2",
  },
  X_INTEGRATION: {
    key: "X_INTEGRATION",
    enabled: false,
    description: "Live X/Twitter headlines (stub provider — needs API credentials)",
    phase: "v2",
  },
  INSTAGRAM_INTEGRATION: {
    key: "INSTAGRAM_INTEGRATION",
    enabled: false,
    description: "Instagram India trend intelligence (stub provider — needs scraping infra)",
    phase: "v2",
  },
  CREATOR_RADAR: {
    key: "CREATOR_RADAR",
    enabled: false,
    description: "Indian creator activity tracking",
    phase: "v2",
  },
  STARTUP_RADAR: {
    key: "STARTUP_RADAR",
    enabled: false,
    description: "Funding rounds, acquisitions, launches",
    phase: "v2",
  },
  AI_SIGNALS_LAB: {
    key: "AI_SIGNALS_LAB",
    enabled: false,
    description: "Predictive AI signals with confidence scoring",
    phase: "v2",
  },
  WEEKLY_REVIEW: {
    key: "WEEKLY_REVIEW",
    enabled: false,
    description: "Automated weekly review export",
    phase: "v2",
  },
  TOOL_SPOTLIGHT: {
    key: "TOOL_SPOTLIGHT",
    enabled: false,
    description: "Daily AI/Productivity/Developer tool spotlight",
    phase: "v2",
  },
  LEARNING_FEED: {
    key: "LEARNING_FEED",
    enabled: false,
    description: "Personalized learning feed (Dev.to, freeCodeCamp, YouTube)",
    phase: "v2",
  },
  PLACEMENT_TRACKER: {
    key: "PLACEMENT_TRACKER",
    enabled: false,
    description: "Big-tech placement tracker for students",
    phase: "v2",
  },
  DAILY_MISSIONS: {
    key: "DAILY_MISSIONS",
    enabled: flag("NEXT_PUBLIC_FF_DAILY_MISSIONS", false),
    description: "Gamified daily missions with XP/streaks",
    phase: "v2",
  },
  INTELLIGENCE_SCORE: {
    key: "INTELLIGENCE_SCORE",
    enabled: flag("NEXT_PUBLIC_FF_INTELLIGENCE_SCORE", false),
    description: "Daily/weekly/monthly intelligence scoring",
    phase: "v2",
  },
} as const satisfies Record<string, FeatureFlag>;

export type FeatureKey = keyof typeof FEATURES;

export function isEnabled(key: FeatureKey): boolean {
  return FEATURES[key]?.enabled ?? false;
}
