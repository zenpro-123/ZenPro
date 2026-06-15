import {
  Home,
  Bookmark,
  Activity,
  Radio,
  Rocket,
  GraduationCap,
  FlaskConical,
  CalendarCheck,
  Building2,
  Wrench,
  Target,
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
  { label: "Learning Feed", icon: GraduationCap },
  { label: "AI Signals Lab", icon: FlaskConical },
  { label: "Weekly Review", icon: CalendarCheck },
  { label: "Placement Tracker", icon: Building2 },
  { label: "Tool Spotlight", icon: Wrench },
  { label: "Daily Missions", icon: Target },
];
