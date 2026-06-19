import {
  Home,
  BookOpen,
  Bookmark,
  StickyNote,
  Activity,
  Radio,
  Rocket,
  GraduationCap,
  CalendarCheck,
  Building2,
  Wrench,
  History,
  Radar,
  Signal,
  Cpu,
  Map,
  Hammer,
  type LucideIcon,
} from "lucide-react";
import { FEATURES } from "@/config/features";

export interface NavItem {
  href?: string;
  label: string;
  icon: LucideIcon;
  description: string;
  comingSoon?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "now",
    label: "NOW",
    items: [
      { href: "/", label: "Home", icon: Home, description: "Your personalized daily intelligence briefing." },
      ...(FEATURES.WEEKLY_REVIEW.enabled
        ? [{ href: "/review", label: "Weekly Review", icon: CalendarCheck, description: "A summary of the most important developments from the past week." }]
        : []),
      ...(FEATURES.INTELLIGENCE_TIMELINE.enabled
        ? [{ href: "/timeline", label: "Timeline", icon: History, description: "Explore historical intelligence snapshots and trends." }]
        : []),
    ],
  },
  {
    id: "next",
    label: "NEXT",
    items: [
      ...(FEATURES.LEARNING_FEED.enabled
        ? [{ href: "/learning", label: "Learning", icon: GraduationCap, description: "Curated learning resources from developer communities." }]
        : []),
      ...(FEATURES.TOOL_SPOTLIGHT.enabled
        ? [{ href: "/tools", label: "Tools", icon: Wrench, description: "Discover useful tools, products, and developer resources." }]
        : []),
      ...(FEATURES.SKILL_RADAR.enabled
        ? [{ href: "/skills", label: "Skills Radar", icon: Radar, description: "Track which skills and technologies are gaining momentum." }]
        : []),
      ...(FEATURES.CAREER_SIGNALS.enabled
        ? [{ href: "/signals", label: "Career Signals", icon: Signal, description: "Hiring trends, demand shifts, and market insights." }]
        : []),
      ...(FEATURES.EMERGING_TECH.enabled
        ? [{ href: "/emerging", label: "Emerging Tech", icon: Cpu, description: "Technologies appearing across multiple sources before they become mainstream." }]
        : []),
    ],
  },
  {
    id: "build",
    label: "BUILD",
    items: [
      ...(FEATURES.PLACEMENT_TRACKER.enabled
        ? [{ href: "/placement", label: "Placement", icon: Building2, description: "Track applications, opportunities, and hiring progress." }]
        : []),
      ...(FEATURES.OPPORTUNITY_MAP.enabled
        ? [{ href: "/opportunities", label: "Opportunity Map", icon: Map, description: "Discover and organize opportunities by category and skill." }]
        : []),
      ...(FEATURES.BUILD_NEXT.enabled
        ? [{ href: "/build", label: "Build Next", icon: Hammer, description: "Project ideas generated from current industry and technology trends." }]
        : []),
    ],
  },
  {
    id: "save",
    label: "SAVE",
    items: [
      ...(FEATURES.SAVED_ITEMS.enabled
        ? [{ href: "/saved", label: "Saved", icon: Bookmark, description: "Articles, opportunities, and resources you've bookmarked." }]
        : []),
      ...(FEATURES.KNOWLEDGE_NOTES.enabled
        ? [{ href: "/notes", label: "Notes", icon: StickyNote, description: "Personal notes and insights connected to your research." }]
        : []),
      ...(FEATURES.KNOWLEDGE_WORKSPACE.enabled
        ? [{ href: "/knowledge", label: "Knowledge", icon: BookOpen, description: "Your organized knowledge base and connected information." }]
        : []),
    ],
  },
  {
    id: "coming-soon",
    label: "COMING SOON",
    items: [
      { label: "Social Pulse", icon: Activity, description: "Coming soon — monitor major discussions and online trends.", comingSoon: true },
      { label: "Creator Radar", icon: Radio, description: "Coming soon — follow creator activity and emerging voices.", comingSoon: true },
      { label: "Startup Radar", icon: Rocket, description: "Coming soon — track startups, launches, and ecosystem activity.", comingSoon: true },
    ],
  },
];

/** Flat list of live (non-coming-soon) nav items. Used by CommandCenter. */
export const NAV_ITEMS: (NavItem & { href: string })[] = NAV_GROUPS
  .flatMap((g) => g.items)
  .filter((item): item is NavItem & { href: string } => !item.comingSoon && !!item.href);
