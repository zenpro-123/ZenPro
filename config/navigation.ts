import {
  Home,
  BookOpen,
  Bookmark,
  StickyNote,
  Activity,
  Radio,
  Rocket,
  GraduationCap,
  FlaskConical,
  CalendarCheck,
  Building2,
  Wrench,
  Target,
  History,
  type LucideIcon,
} from "lucide-react";
import { FEATURES } from "@/config/features";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Live routes (V1). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  ...(FEATURES.SAVED_ITEMS.enabled ? [{ href: "/saved", label: "Saved", icon: Bookmark }] : []),
  ...(FEATURES.KNOWLEDGE_NOTES.enabled ? [{ href: "/notes", label: "Notes", icon: StickyNote }] : []),
  ...(FEATURES.WEEKLY_REVIEW.enabled ? [{ href: "/review", label: "Weekly Review", icon: CalendarCheck }] : []),
  ...(FEATURES.INTELLIGENCE_TIMELINE.enabled ? [{ href: "/timeline", label: "Timeline", icon: History }] : []),
  ...(FEATURES.KNOWLEDGE_WORKSPACE.enabled ? [{ href: "/knowledge", label: "Knowledge", icon: BookOpen }] : []),
  ...(FEATURES.PLACEMENT_TRACKER.enabled ? [{ href: "/placement", label: "Placement", icon: Building2 }] : []),
  ...(FEATURES.LEARNING_FEED.enabled ? [{ href: "/learning", label: "Learning", icon: GraduationCap }] : []),
  ...(FEATURES.TOOL_SPOTLIGHT.enabled ? [{ href: "/tools", label: "Tools", icon: Wrench }] : []),
];

export interface ComingSoonItem {
  label: string;
  icon: LucideIcon;
}

/**
 * Modules whose providers/AI pipelines are deferred to V2 (see config/features.ts).
 * Shown in the sidebar as disabled entries so the full information architecture
 * is visible without shipping placeholder pages.
 */
export const COMING_SOON_ITEMS: ComingSoonItem[] = [
  { label: "Social Pulse", icon: Activity },
  { label: "Creator Radar", icon: Radio },
  { label: "Startup Radar", icon: Rocket },
  { label: "AI Signals Lab", icon: FlaskConical },
  { label: "Daily Missions", icon: Target },
];
