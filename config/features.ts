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

export type FeaturePhase = "v1" | "v2" | "v3" | "v3c" | "v4";

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
  KNOWLEDGE_NOTES: {
    key: "KNOWLEDGE_NOTES",
    enabled: flag("NEXT_PUBLIC_FF_KNOWLEDGE_NOTES", true),
    description: "Knowledge Notes — personal annotations on saved content",
    phase: "v1",
  },
  WHAT_CHANGED: {
    key: "WHAT_CHANGED",
    enabled: flag("NEXT_PUBLIC_FF_WHAT_CHANGED", true),
    description: "What Changed Since Yesterday — diff against the prior daily snapshot",
    phase: "v1",
  },
  RECOMMENDED_FOR_YOU: {
    key: "RECOMMENDED_FOR_YOU",
    enabled: flag("NEXT_PUBLIC_FF_RECOMMENDED_FOR_YOU", true),
    description: "Weighted recommendation engine personalized picks",
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
  WEEKLY_REVIEW: {
    key: "WEEKLY_REVIEW",
    enabled: flag("NEXT_PUBLIC_FF_WEEKLY_REVIEW", true),
    description: "Deterministic weekly executive review from daily snapshots",
    phase: "v2",
  },
  TOOL_SPOTLIGHT: {
    key: "TOOL_SPOTLIGHT",
    enabled: flag("NEXT_PUBLIC_FF_TOOL_SPOTLIGHT", true),
    description: "Daily AI/Productivity/Developer tool spotlight (Product Hunt)",
    phase: "v2",
  },
  LEARNING_FEED: {
    key: "LEARNING_FEED",
    enabled: flag("NEXT_PUBLIC_FF_LEARNING_FEED", true),
    description: "Learning feed (Dev.to, freeCodeCamp, Hacker News)",
    phase: "v2",
  },
  PLACEMENT_TRACKER: {
    key: "PLACEMENT_TRACKER",
    enabled: flag("NEXT_PUBLIC_FF_PLACEMENT_TRACKER", true),
    description: "Manual job-application tracker (interested → applied → offer)",
    phase: "v2",
  },
  INTELLIGENCE_TIMELINE: {
    key: "INTELLIGENCE_TIMELINE",
    enabled: flag("NEXT_PUBLIC_FF_INTELLIGENCE_TIMELINE", true),
    description: "Browsable history of past daily intelligence snapshots",
    phase: "v2",
  },
  KNOWLEDGE_WORKSPACE: {
    key: "KNOWLEDGE_WORKSPACE",
    enabled: flag("NEXT_PUBLIC_FF_KNOWLEDGE_WORKSPACE", true),
    description: "Knowledge workspace — notes, tags, linked content, backlinks",
    phase: "v3",
  },

  // --- V4: Opportunity Intelligence Layer ---
  SKILL_RADAR: {
    key: "SKILL_RADAR",
    enabled: flag("NEXT_PUBLIC_FF_SKILL_RADAR", true),
    description: "Skill Demand Radar — frequency-ranked skills with growth indicators",
    phase: "v4",
  },
  CAREER_SIGNALS: {
    key: "CAREER_SIGNALS",
    enabled: flag("NEXT_PUBLIC_FF_CAREER_SIGNALS", true),
    description: "Career Signals — deterministic hiring/skill/technology analytics",
    phase: "v4",
  },
  EMERGING_TECH: {
    key: "EMERGING_TECH",
    enabled: flag("NEXT_PUBLIC_FF_EMERGING_TECH", true),
    description: "Emerging Technologies — cross-source technology detection",
    phase: "v4",
  },
  OPPORTUNITY_MAP: {
    key: "OPPORTUNITY_MAP",
    enabled: flag("NEXT_PUBLIC_FF_OPPORTUNITY_MAP", true),
    description: "Opportunity Map — opportunity discovery and analytics",
    phase: "v4",
  },
  BUILD_NEXT: {
    key: "BUILD_NEXT",
    enabled: flag("NEXT_PUBLIC_FF_BUILD_NEXT", true),
    description: "Build This Next — deterministic project idea generator from trends",
    phase: "v4",
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
