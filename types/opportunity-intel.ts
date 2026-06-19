import type { ContentCategory, TrendDirection } from "@/types/content";
import type { SnapshotOpportunity } from "@/types/intelligence";

/** Which data category a skill/technology mention was sourced from. */
export type SkillSource = "career" | "github" | "learning" | "tech" | "tools";

/** Broad grouping for an extracted skill, used for filtering. */
export type SkillCategory =
  | "language"
  | "framework"
  | "database"
  | "cloud"
  | "ai"
  | "devops"
  | "tool";

// --- Module 1: Skill Demand Radar ---

export interface SkillEntry {
  name: string;
  /** Total mentions across all sources in the current window. */
  count: number;
  /** Growth vs the previous window. */
  trend: TrendDirection;
  /** Which categories mention this skill (deduped). */
  sources: SkillSource[];
  /** Percentage change vs the previous window (0 when previous was 0). */
  growthPercent: number;
  category: SkillCategory;
}

export interface SkillRadarResponse {
  skills: SkillEntry[];
  windowDays: number;
  generatedAt: string;
}

// --- Module 2: Career Signals ---

export type SignalType =
  | "hiring_trend"
  | "skill_demand"
  | "technology_shift"
  | "market_pattern";

export type SignalStrength = "strong" | "moderate" | "emerging";

export interface CareerSignal {
  id: string;
  type: SignalType;
  title: string;
  description: string;
  /** Supporting data points rendered as a bulleted list. */
  evidence: string[];
  strength: SignalStrength;
  trend: TrendDirection;
}

export interface CareerSignalsResponse {
  signals: CareerSignal[];
  generatedAt: string;
}

// --- Module 3: Emerging Technologies ---

export interface EmergingTechSource {
  category: SkillSource;
  count: number;
}

export interface EmergingTech {
  name: string;
  /** 0–1, based on cross-source presence. */
  confidence: number;
  sources: EmergingTechSource[];
  trend: TrendDirection;
  description: string;
}

export interface EmergingTechResponse {
  technologies: EmergingTech[];
  generatedAt: string;
}

// --- Module 4: Opportunity Map ---

export interface CategoryCount {
  category: string;
  count: number;
}

export interface SkillTrendCount {
  skill: string;
  count: number;
  trend: TrendDirection;
}

export interface OpportunityAnalytics {
  totalActive: number;
  byCategory: CategoryCount[];
  topSkills: SkillTrendCount[];
  recentOpportunities: SnapshotOpportunity[];
  recommendedOpportunities: SnapshotOpportunity[];
}

export interface OpportunityMapResponse {
  analytics: OpportunityAnalytics;
  generatedAt: string;
}

// --- Module 5: Build This Next ---

export type ProjectDifficulty = "beginner" | "intermediate" | "advanced";

export interface ProjectInspiration {
  type: "skill" | "repo" | "tool";
  name: string;
  url?: string;
}

export interface ProjectIdea {
  id: string;
  title: string;
  rationale: string;
  suggestedStack: string[];
  difficulty: ProjectDifficulty;
  estimatedDuration: string;
  inspiration: ProjectInspiration[];
  featured: boolean;
}

export interface BuildNextResponse {
  featured: ProjectIdea | null;
  ideas: ProjectIdea[];
  generatedAt: string;
}

/** Re-exported for module components that map signal/difficulty levels to badges. */
export type { ContentCategory, TrendDirection };
