import type { ProjectDifficulty, ProjectIdea, ProjectInspiration } from "@/types/opportunity-intel";
import type { SkillEntry } from "@/types/opportunity-intel";
import type { SnapshotRepo } from "@/types/intelligence";

/** A data slot a template needs filled from current trending data. */
export type TemplateSlot = "skill_primary" | "skill_secondary" | "repo" | "tool";

export interface ProjectTemplate {
  id: string;
  /** Title with {skill}, {skill2}, {repo}, {tool} placeholders. */
  titlePattern: string;
  /** Rationale with the same placeholders + {growth}. */
  rationalePattern: string;
  requiredSlots: TemplateSlot[];
  difficulty: ProjectDifficulty;
  estimatedDuration: string;
  /** Base stack, augmented with the trending primary skill at fill time. */
  stackHints: string[];
}

/**
 * Deterministic project idea templates. Each gets scored by how many of its
 * required data slots have strong trending data, then filled with the actual
 * top skill / trending repo / tool category.
 */
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "skill-dashboard",
    titlePattern: "Build a {skill} Analytics Dashboard",
    rationalePattern:
      "{skill} demand is climbing ({growth}). A polished analytics dashboard is a portfolio-ready way to show depth in it.",
    requiredSlots: ["skill_primary"],
    difficulty: "intermediate",
    estimatedDuration: "3–5 days",
    stackHints: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase"],
  },
  {
    id: "skill-cli",
    titlePattern: "Ship a {skill} CLI Tool",
    rationalePattern:
      "A focused command-line tool is the fastest way to demonstrate {skill} fundamentals and ranks well on GitHub.",
    requiredSlots: ["skill_primary"],
    difficulty: "beginner",
    estimatedDuration: "1–2 days",
    stackHints: ["Node.js", "TypeScript"],
  },
  {
    id: "ai-analyzer",
    titlePattern: "AI-Powered {skill} Analyzer",
    rationalePattern:
      "Combine {skill} with an LLM to auto-analyze and summarize. AI tooling is one of the fastest-growing areas in the feed.",
    requiredSlots: ["skill_primary", "tool"],
    difficulty: "advanced",
    estimatedDuration: "1–2 weeks",
    stackHints: ["Next.js", "Gemini", "Supabase"],
  },
  {
    id: "repo-alternative",
    titlePattern: "Build an Open-Source Alternative to {repo}",
    rationalePattern:
      "{repo} is trending right now. A lean, opinionated alternative is a strong way to ride the momentum and learn from a proven design.",
    requiredSlots: ["repo", "skill_primary"],
    difficulty: "advanced",
    estimatedDuration: "2–4 weeks",
    stackHints: ["TypeScript", "Next.js"],
  },
  {
    id: "skill-combo-app",
    titlePattern: "Full-Stack App with {skill} + {skill2}",
    rationalePattern:
      "Pairing {skill} and {skill2} — both in demand — produces a realistic full-stack project that maps directly to job postings.",
    requiredSlots: ["skill_primary", "skill_secondary"],
    difficulty: "intermediate",
    estimatedDuration: "1 week",
    stackHints: ["Next.js", "PostgreSQL"],
  },
  {
    id: "tool-clone",
    titlePattern: "Recreate a Trending {tool} Tool",
    rationalePattern:
      "Trending {tool} tools are getting attention. Cloning the core of one teaches product sense and ships fast.",
    requiredSlots: ["tool", "skill_primary"],
    difficulty: "intermediate",
    estimatedDuration: "4–6 days",
    stackHints: ["Next.js", "Tailwind CSS"],
  },
  {
    id: "skill-api",
    titlePattern: "Design a {skill} REST/GraphQL API",
    rationalePattern:
      "A well-documented {skill} API with auth and tests is exactly what backend interviews probe for.",
    requiredSlots: ["skill_primary"],
    difficulty: "intermediate",
    estimatedDuration: "3–5 days",
    stackHints: ["Node.js", "PostgreSQL", "GraphQL"],
  },
  {
    id: "skill-extension",
    titlePattern: "Browser Extension Powered by {skill}",
    rationalePattern:
      "Browser extensions have a tight scope and a real user base — a great showcase for {skill} without months of work.",
    requiredSlots: ["skill_primary"],
    difficulty: "beginner",
    estimatedDuration: "2–4 days",
    stackHints: ["TypeScript", "React"],
  },
  {
    id: "ai-agent",
    titlePattern: "Autonomous {skill} Agent",
    rationalePattern:
      "Agentic AI is a breakout theme. Wiring {skill} into a tool-using agent demonstrates cutting-edge skills employers are chasing.",
    requiredSlots: ["skill_primary", "tool"],
    difficulty: "advanced",
    estimatedDuration: "2–3 weeks",
    stackHints: ["Next.js", "Gemini", "MCP"],
  },
  {
    id: "data-pipeline",
    titlePattern: "Real-Time {skill} Data Pipeline",
    rationalePattern:
      "Streaming pipelines are core to data and platform roles. A working {skill} pipeline is a standout portfolio piece.",
    requiredSlots: ["skill_primary"],
    difficulty: "advanced",
    estimatedDuration: "1–2 weeks",
    stackHints: ["Python", "Kafka", "PostgreSQL"],
  },
  {
    id: "skill-mobile",
    titlePattern: "Cross-Platform {skill} Mobile App",
    rationalePattern:
      "Mobile reach plus {skill} makes for a memorable demo. Ship to a store to stand out from web-only portfolios.",
    requiredSlots: ["skill_primary"],
    difficulty: "intermediate",
    estimatedDuration: "1–2 weeks",
    stackHints: ["React Native", "TypeScript"],
  },
  {
    id: "skill-starter",
    titlePattern: "Open-Source {skill} Starter Template",
    rationalePattern:
      "A batteries-included {skill} starter others can fork is high-leverage: it earns stars and shows architectural taste.",
    requiredSlots: ["skill_primary"],
    difficulty: "beginner",
    estimatedDuration: "2–3 days",
    stackHints: ["Next.js", "TypeScript", "Tailwind CSS"],
  },
];

/** Format a skill's growth as a short human phrase for rationale text. */
function growthPhrase(skill: SkillEntry | undefined): string {
  if (!skill) return "with rising demand";
  if (skill.trend === "new") return "newly emerging in the feed";
  if (skill.trend === "up") return `up ${Math.abs(skill.growthPercent)}% week over week`;
  if (skill.trend === "down") return "still widely requested";
  return "with steady demand";
}

/**
 * Fill a template with current trending data, producing a concrete ProjectIdea.
 * Falls back gracefully when a slot has no data.
 */
export function fillTemplate(
  template: ProjectTemplate,
  ctx: {
    skills: SkillEntry[];
    repos: SnapshotRepo[];
    toolCategories: string[];
    index: number;
    featured: boolean;
  }
): ProjectIdea {
  const primary = ctx.skills[ctx.index % Math.max(ctx.skills.length, 1)] ?? ctx.skills[0];
  const secondary = ctx.skills.find((s) => s.name !== primary?.name) ?? ctx.skills[1];
  const repo = ctx.repos[ctx.index % Math.max(ctx.repos.length, 1)] ?? ctx.repos[0];
  const toolCategory = ctx.toolCategories[ctx.index % Math.max(ctx.toolCategories.length, 1)] ?? ctx.toolCategories[0];

  const skillName = primary?.name ?? "TypeScript";
  const skill2Name = secondary?.name ?? "PostgreSQL";
  const repoName = repo?.fullName?.split("/").pop() ?? "a trending repo";
  const toolName = toolCategory ?? "AI";

  function apply(pattern: string): string {
    return pattern
      .replaceAll("{skill2}", skill2Name)
      .replaceAll("{skill}", skillName)
      .replaceAll("{repo}", repoName)
      .replaceAll("{tool}", toolName[0].toUpperCase() + toolName.slice(1))
      .replaceAll("{growth}", growthPhrase(primary));
  }

  const inspiration: ProjectInspiration[] = [];
  if (template.requiredSlots.some((s) => s.startsWith("skill")) && primary) {
    inspiration.push({ type: "skill", name: primary.name });
  }
  if (template.requiredSlots.includes("repo") && repo) {
    inspiration.push({ type: "repo", name: repo.fullName, url: repo.url });
  }
  if (template.requiredSlots.includes("tool") && toolCategory) {
    inspiration.push({ type: "tool", name: `${toolName} tools` });
  }

  // Augment base stack with the trending primary skill if not already present.
  const suggestedStack = [...template.stackHints];
  if (primary && !suggestedStack.includes(primary.name)) {
    suggestedStack.unshift(primary.name);
  }

  return {
    id: `${template.id}-${ctx.index}`,
    title: apply(template.titlePattern),
    rationale: apply(template.rationalePattern),
    suggestedStack: suggestedStack.slice(0, 5),
    difficulty: template.difficulty,
    estimatedDuration: template.estimatedDuration,
    inspiration,
    featured: ctx.featured,
  };
}
