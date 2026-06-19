import { withCache, CACHE_TTL } from "@/lib/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodaySnapshot } from "@/lib/intelligence/snapshot-service";
import { PROJECT_TEMPLATES, fillTemplate, type ProjectTemplate } from "@/lib/intelligence/project-templates";
import type { ContentItemRow } from "@/types/recommendation";
import type { TrendDirection } from "@/types/content";
import type { SnapshotOpportunity, SnapshotRepo } from "@/types/intelligence";
import type {
  SkillEntry,
  SkillSource,
  SkillCategory,
  SkillRadarResponse,
  CareerSignal,
  CareerSignalsResponse,
  EmergingTech,
  EmergingTechResponse,
  EmergingTechSource,
  OpportunityAnalytics,
  OpportunityMapResponse,
  ProjectIdea,
  BuildNextResponse,
} from "@/types/opportunity-intel";

// --- Skill dictionary -------------------------------------------------------

interface SkillDef {
  name: string;
  category: SkillCategory;
  /** Normalized alias tokens that map to this canonical skill. */
  aliases: string[];
}

/**
 * Curated dictionary of skills/technologies we recognize. Only terms that match
 * an entry here are counted — this keeps the radar deterministic and free of
 * noise from generic tags like "remote", "senior", or "tutorial".
 */
const SKILL_DEFS: SkillDef[] = [
  // Languages
  { name: "JavaScript", category: "language", aliases: ["javascript", "js"] },
  { name: "TypeScript", category: "language", aliases: ["typescript", "ts"] },
  { name: "Python", category: "language", aliases: ["python", "py"] },
  { name: "Go", category: "language", aliases: ["go", "golang"] },
  { name: "Rust", category: "language", aliases: ["rust"] },
  { name: "Java", category: "language", aliases: ["java"] },
  { name: "C++", category: "language", aliases: ["c++", "cpp"] },
  { name: "C#", category: "language", aliases: ["c#", "csharp"] },
  { name: "Ruby", category: "language", aliases: ["ruby"] },
  { name: "PHP", category: "language", aliases: ["php"] },
  { name: "Swift", category: "language", aliases: ["swift"] },
  { name: "Kotlin", category: "language", aliases: ["kotlin"] },
  { name: "Scala", category: "language", aliases: ["scala"] },
  { name: "Elixir", category: "language", aliases: ["elixir"] },
  { name: "Dart", category: "language", aliases: ["dart"] },
  { name: "SQL", category: "language", aliases: ["sql"] },
  { name: "Solidity", category: "language", aliases: ["solidity"] },
  // Frameworks / libraries
  { name: "React", category: "framework", aliases: ["react", "reactjs", "react.js"] },
  { name: "Next.js", category: "framework", aliases: ["next.js", "nextjs", "next-js", "next"] },
  { name: "Vue", category: "framework", aliases: ["vue", "vuejs", "vue.js"] },
  { name: "Angular", category: "framework", aliases: ["angular", "angularjs"] },
  { name: "Svelte", category: "framework", aliases: ["svelte", "sveltekit"] },
  { name: "Node.js", category: "framework", aliases: ["node.js", "nodejs", "node"] },
  { name: "Express", category: "framework", aliases: ["express", "expressjs"] },
  { name: "Django", category: "framework", aliases: ["django"] },
  { name: "Flask", category: "framework", aliases: ["flask"] },
  { name: "FastAPI", category: "framework", aliases: ["fastapi", "fast-api"] },
  { name: "Spring", category: "framework", aliases: ["spring", "spring-boot", "springboot"] },
  { name: "Rails", category: "framework", aliases: ["rails", "ruby-on-rails", "ror"] },
  { name: "Laravel", category: "framework", aliases: ["laravel"] },
  { name: "Flutter", category: "framework", aliases: ["flutter"] },
  { name: "React Native", category: "framework", aliases: ["react-native", "reactnative"] },
  { name: "Tailwind CSS", category: "framework", aliases: ["tailwind", "tailwindcss", "tailwind-css"] },
  { name: "Astro", category: "framework", aliases: ["astro"] },
  { name: "Remix", category: "framework", aliases: ["remix"] },
  { name: "Deno", category: "framework", aliases: ["deno"] },
  { name: "Bun", category: "framework", aliases: ["bun"] },
  // Databases
  { name: "PostgreSQL", category: "database", aliases: ["postgresql", "postgres", "psql"] },
  { name: "MySQL", category: "database", aliases: ["mysql"] },
  { name: "MongoDB", category: "database", aliases: ["mongodb", "mongo"] },
  { name: "Redis", category: "database", aliases: ["redis"] },
  { name: "SQLite", category: "database", aliases: ["sqlite"] },
  { name: "Supabase", category: "database", aliases: ["supabase"] },
  { name: "Firebase", category: "database", aliases: ["firebase"] },
  { name: "Elasticsearch", category: "database", aliases: ["elasticsearch", "elastic"] },
  { name: "Cassandra", category: "database", aliases: ["cassandra"] },
  { name: "DynamoDB", category: "database", aliases: ["dynamodb"] },
  { name: "Prisma", category: "database", aliases: ["prisma"] },
  { name: "GraphQL", category: "database", aliases: ["graphql"] },
  // Cloud
  { name: "AWS", category: "cloud", aliases: ["aws", "amazon-web-services"] },
  { name: "Google Cloud", category: "cloud", aliases: ["gcp", "google-cloud", "google-cloud-platform"] },
  { name: "Azure", category: "cloud", aliases: ["azure", "microsoft-azure"] },
  { name: "Vercel", category: "cloud", aliases: ["vercel"] },
  { name: "Netlify", category: "cloud", aliases: ["netlify"] },
  { name: "Cloudflare", category: "cloud", aliases: ["cloudflare"] },
  { name: "DigitalOcean", category: "cloud", aliases: ["digitalocean", "digital-ocean"] },
  // AI
  { name: "Machine Learning", category: "ai", aliases: ["machine-learning", "ml", "machinelearning"] },
  { name: "Deep Learning", category: "ai", aliases: ["deep-learning", "deeplearning"] },
  { name: "TensorFlow", category: "ai", aliases: ["tensorflow"] },
  { name: "PyTorch", category: "ai", aliases: ["pytorch"] },
  { name: "LangChain", category: "ai", aliases: ["langchain"] },
  { name: "LangGraph", category: "ai", aliases: ["langgraph"] },
  { name: "MCP", category: "ai", aliases: ["mcp", "model-context-protocol"] },
  { name: "LLM", category: "ai", aliases: ["llm", "llms", "large-language-model"] },
  { name: "OpenAI", category: "ai", aliases: ["openai"] },
  { name: "Hugging Face", category: "ai", aliases: ["huggingface", "hugging-face"] },
  { name: "RAG", category: "ai", aliases: ["rag", "retrieval-augmented-generation"] },
  { name: "Computer Vision", category: "ai", aliases: ["computer-vision", "opencv", "cv"] },
  { name: "NLP", category: "ai", aliases: ["nlp", "natural-language-processing"] },
  { name: "Gemini", category: "ai", aliases: ["gemini"] },
  // DevOps
  { name: "Docker", category: "devops", aliases: ["docker"] },
  { name: "Kubernetes", category: "devops", aliases: ["kubernetes", "k8s"] },
  { name: "Terraform", category: "devops", aliases: ["terraform"] },
  { name: "GitHub Actions", category: "devops", aliases: ["github-actions", "githubactions"] },
  { name: "CI/CD", category: "devops", aliases: ["ci/cd", "cicd", "ci-cd"] },
  { name: "Ansible", category: "devops", aliases: ["ansible"] },
  { name: "Jenkins", category: "devops", aliases: ["jenkins"] },
  { name: "Git", category: "devops", aliases: ["git"] },
  { name: "Linux", category: "devops", aliases: ["linux"] },
  { name: "Kafka", category: "devops", aliases: ["kafka"] },
  { name: "gRPC", category: "devops", aliases: ["grpc"] },
];

/** Lookup map: normalized alias token → canonical skill definition. */
const SKILL_LOOKUP = new Map<string, SkillDef>();
for (const def of SKILL_DEFS) {
  for (const alias of def.aliases) {
    SKILL_LOOKUP.set(alias, def);
  }
}

/** Normalize a raw tag/term into a lookup key. */
function normalizeToken(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "-");
}

/** Resolve a raw tag to its canonical skill definition, if recognized. */
function matchSkill(raw: string): SkillDef | null {
  return SKILL_LOOKUP.get(normalizeToken(raw)) ?? null;
}

/**
 * Alias tokens that are too ambiguous to match inside free-text titles/summaries
 * (common English words, short acronyms, or symbols that defeat word boundaries).
 * They're still matched exactly against discrete tags — just not against prose.
 */
const TEXT_UNSAFE = new Set([
  "js", "ts", "py", "ml", "cv", "ai", "rag", "nlp", "cpp", "csharp", "c#", "c++",
  "go", "next", "spring", "swift", "rust", "java", "dart", "bun", "node", "express",
  "remix", "astro", "kafka", "deno", "git", "sql", "ror", "ci/cd", "ci-cd", "k8s",
  "spring-boot", "springboot",
]);

/**
 * Per-skill regexes for scanning prose. Built from each skill's distinctive
 * aliases (ambiguous ones filtered out), with word boundaries so "react" won't
 * match "reactive" and hyphenated aliases also match their spaced form (e.g.
 * "machine-learning" → "machine learning").
 */
const TEXT_MATCHERS: { def: SkillDef; regex: RegExp }[] = [];
for (const def of SKILL_DEFS) {
  const patterns = def.aliases
    .filter((a) => !TEXT_UNSAFE.has(a) && a.length >= 3)
    .map((a) => a.replace(/[.+#]/g, (m) => `\\${m}`).replace(/-/g, "[-\\s]"));
  if (patterns.length === 0) continue;
  TEXT_MATCHERS.push({
    def,
    regex: new RegExp(`(?<![\\w])(?:${patterns.join("|")})(?![\\w])`, "i"),
  });
}

/** Map a content category to its skill source label. */
function categoryToSource(category: string): SkillSource | null {
  switch (category) {
    case "career":
      return "career";
    case "github":
      return "github";
    case "learning":
      return "learning";
    case "tech":
      return "tech";
    case "tools":
      return "tools";
    default:
      return null;
  }
}

interface SkillAccumulator {
  def: SkillDef;
  count: number;
  sources: Set<SkillSource>;
}

/**
 * Deterministically extract recognized skills from a set of content rows. Counts
 * each skill mention and tracks which categories surfaced it. Pulls from the
 * `tags` array plus category-specific metadata (`language` for GitHub).
 */
function extractSkills(items: ContentItemRow[]): Map<string, SkillAccumulator> {
  const acc = new Map<string, SkillAccumulator>();

  function record(def: SkillDef, source: SkillSource | null) {
    const existing = acc.get(def.name);
    if (existing) {
      existing.count += 1;
      if (source) existing.sources.add(source);
    } else {
      acc.set(def.name, {
        def,
        count: 1,
        sources: new Set(source ? [source] : []),
      });
    }
  }

  for (const item of items) {
    const source = categoryToSource(item.category);

    // tags array (present across career, github, learning, tech, tools)
    const seen = new Set<string>();
    for (const tag of item.tags ?? []) {
      const def = matchSkill(tag);
      if (def && !seen.has(def.name)) {
        seen.add(def.name);
        record(def, source);
      }
    }

    // GitHub primary language
    const language = item.metadata?.language;
    if (typeof language === "string") {
      const def = matchSkill(language);
      if (def && !seen.has(def.name)) {
        seen.add(def.name);
        record(def, source);
      }
    }

    // Career provider sometimes nests tags under metadata.tags
    const metaTags = item.metadata?.tags;
    if (Array.isArray(metaTags)) {
      for (const tag of metaTags) {
        if (typeof tag !== "string") continue;
        const def = matchSkill(tag);
        if (def && !seen.has(def.name)) {
          seen.add(def.name);
          record(def, source);
        }
      }
    }

    // Free-text scan of title + summary. Career/tech tags are often non-technical
    // (job functions, editorial topics), so the actual stack is usually only named
    // in the prose. Distinctive, word-boundary-safe terms only (see TEXT_MATCHERS).
    const text = `${item.title ?? ""} ${item.summary ?? ""}`;
    if (text.trim().length > 0) {
      for (const { def, regex } of TEXT_MATCHERS) {
        if (!seen.has(def.name) && regex.test(text)) {
          seen.add(def.name);
          record(def, source);
        }
      }
    }
  }

  return acc;
}

// --- Data loading -----------------------------------------------------------

const ISO_DAY_MS = 24 * 60 * 60 * 1000;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * ISO_DAY_MS).toISOString();
}

/**
 * Load content rows published within a window. `fromDays`/`toDays` are day
 * offsets back from now (e.g. {fromDays: 7, toDays: 0} = the last 7 days).
 */
async function loadContentWindow(opts: {
  fromDays: number;
  toDays?: number;
  category?: string;
  limit?: number;
}): Promise<ContentItemRow[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("content_items")
      .select("*")
      .gte("published_at", isoDaysAgo(opts.fromDays))
      .order("published_at", { ascending: false })
      .limit(opts.limit ?? 500);

    if (opts.toDays !== undefined && opts.toDays > 0) {
      query = query.lt("published_at", isoDaysAgo(opts.toDays));
    }
    if (opts.category) {
      query = query.eq("category", opts.category);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as ContentItemRow[];
  } catch {
    return [];
  }
}

// --- Trend helpers ----------------------------------------------------------

function computeTrend(current: number, previous: number): TrendDirection {
  if (previous === 0) return current > 0 ? "new" : "stable";
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "stable";
}

function growthPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// --- Module 1: Skill Demand Radar ------------------------------------------

function buildSkillRadar(
  current: ContentItemRow[],
  previous: ContentItemRow[]
): SkillEntry[] {
  const currentSkills = extractSkills(current);
  const previousSkills = extractSkills(previous);

  const entries: SkillEntry[] = [];
  for (const [name, acc] of currentSkills) {
    const prevCount = previousSkills.get(name)?.count ?? 0;
    entries.push({
      name,
      count: acc.count,
      trend: computeTrend(acc.count, prevCount),
      sources: [...acc.sources].sort(),
      growthPercent: growthPercent(acc.count, prevCount),
      category: acc.def.category,
    });
  }

  return entries.sort((a, b) => b.count - a.count).slice(0, 30);
}

export async function getSkillRadar(): Promise<{ data: SkillRadarResponse; cached: boolean }> {
  return withCache("opportunity-intel:skills", CACHE_TTL.SKILL_RADAR, async () => {
    const [current, previous] = await Promise.all([
      loadContentWindow({ fromDays: 7, toDays: 0 }),
      loadContentWindow({ fromDays: 14, toDays: 7 }),
    ]);

    return {
      skills: buildSkillRadar(current, previous),
      windowDays: 7,
      generatedAt: new Date().toISOString(),
    };
  });
}

// --- Module 2: Career Signals ----------------------------------------------

function signalStrength(ratioPercent: number, evidenceCount: number): CareerSignal["strength"] {
  if (ratioPercent > 40 || evidenceCount >= 5) return "strong";
  if (ratioPercent > 20 || evidenceCount >= 3) return "moderate";
  return "emerging";
}

function buildCareerSignals(
  career: ContentItemRow[],
  careerPrev: ContentItemRow[],
  allCurrent: ContentItemRow[]
): CareerSignal[] {
  const signals: CareerSignal[] = [];
  const totalJobs = career.length;
  if (totalJobs === 0) return signals;

  // --- Hiring trends: companies with 3+ postings ---
  const companyCounts = new Map<string, number>();
  for (const item of career) {
    const company = (item.metadata?.company as string) || item.author;
    if (!company) continue;
    companyCounts.set(company, (companyCounts.get(company) ?? 0) + 1);
  }
  const activeCompanies = [...companyCounts.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  for (const [company, count] of activeCompanies) {
    signals.push({
      id: `hiring:${normalizeToken(company)}`,
      type: "hiring_trend",
      title: `${company} is actively hiring`,
      description: `${company} posted ${count} roles in the last two weeks — among the most active employers in the feed.`,
      evidence: [`${count} open roles`, "Multiple postings in 14 days"],
      strength: signalStrength(0, count),
      trend: "up",
    });
  }

  // --- Skill demand: skills in >15% of postings ---
  // Use the shared extractor (tags + language + prose) since RemoteOK tags are
  // often job functions, not stack — the stack is usually named in the summary.
  const skillByJob = new Map<string, number>();
  for (const [name, acc] of extractSkills(career)) skillByJob.set(name, acc.count);
  const prevSkillByJob = extractSkills(careerPrev);
  const rankedSkills = [...skillByJob.entries()].sort((a, b) => b[1] - a[1]);
  for (const [skill, count] of rankedSkills.slice(0, 6)) {
    const pct = Math.round((count / totalJobs) * 100);
    if (pct < 15) continue;
    const prevCount = prevSkillByJob.get(skill)?.count ?? 0;
    signals.push({
      id: `skill:${normalizeToken(skill)}`,
      type: "skill_demand",
      title: `${skill} appears in ${pct}% of postings`,
      description: `${skill} is requested in ${count} of ${totalJobs} recent roles, making it a high-demand skill right now.`,
      evidence: [`${count} of ${totalJobs} postings`, `${pct}% of the market`],
      strength: signalStrength(pct, count),
      trend: computeTrend(count, prevCount),
    });
  }

  // --- Technology shifts: skills spanning career + github ---
  const githubItems = allCurrent.filter((i) => i.category === "github");
  const githubSkills = extractSkills(githubItems);
  for (const [skill, count] of rankedSkills.slice(0, 12)) {
    if (githubSkills.has(skill)) {
      const ghCount = githubSkills.get(skill)!.count;
      signals.push({
        id: `tech:${normalizeToken(skill)}`,
        type: "technology_shift",
        title: `${skill} gaining traction across hiring and open source`,
        description: `${skill} shows up in both job postings (${count}) and trending repositories (${ghCount}) — a sign of durable momentum.`,
        evidence: [`${count} job postings`, `${ghCount} trending repos`],
        strength: signalStrength(0, count + ghCount),
        trend: "up",
      });
      if (signals.filter((s) => s.type === "technology_shift").length >= 3) break;
    }
  }

  // --- Market patterns: remote ratio + job type distribution ---
  const remoteCount = career.filter((i) => i.metadata?.remote === true).length;
  const remotePct = Math.round((remoteCount / totalJobs) * 100);
  if (remoteCount > 0) {
    signals.push({
      id: "market:remote",
      type: "market_pattern",
      title: `${remotePct}% of opportunities are remote`,
      description: `${remoteCount} of ${totalJobs} recent opportunities offer remote work, reflecting continued flexibility in hiring.`,
      evidence: [`${remoteCount} remote roles`, `${totalJobs} total opportunities`],
      strength: signalStrength(remotePct, remoteCount),
      trend: "stable",
    });
  }

  const typeCounts = new Map<string, number>();
  for (const item of career) {
    const type = (item.metadata?.type as string) || "job";
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
  }
  const topType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topType && typeCounts.size > 1) {
    const [type, count] = topType;
    const pct = Math.round((count / totalJobs) * 100);
    signals.push({
      id: `market:type:${type}`,
      type: "market_pattern",
      title: `${type[0].toUpperCase()}${type.slice(1)} roles dominate the feed`,
      description: `${pct}% of recent opportunities are ${type} listings (${count} of ${totalJobs}).`,
      evidence: [`${count} ${type} listings`, `${pct}% of the feed`],
      strength: signalStrength(pct, count),
      trend: "stable",
    });
  }

  const strengthRank: Record<CareerSignal["strength"], number> = {
    strong: 3,
    moderate: 2,
    emerging: 1,
  };
  return signals.sort((a, b) => strengthRank[b.strength] - strengthRank[a.strength]).slice(0, 12);
}

export async function getCareerSignals(): Promise<{ data: CareerSignalsResponse; cached: boolean }> {
  return withCache("opportunity-intel:signals", CACHE_TTL.CAREER_SIGNALS, async () => {
    const [career, careerPrev, allCurrent] = await Promise.all([
      loadContentWindow({ fromDays: 14, toDays: 0, category: "career" }),
      loadContentWindow({ fromDays: 28, toDays: 14, category: "career" }),
      loadContentWindow({ fromDays: 14, toDays: 0 }),
    ]);

    return {
      signals: buildCareerSignals(career, careerPrev, allCurrent),
      generatedAt: new Date().toISOString(),
    };
  });
}

// --- Module 3: Emerging Technologies ---------------------------------------

function buildEmergingTech(
  current: ContentItemRow[],
  previous: ContentItemRow[]
): EmergingTech[] {
  // Group skill mentions by category to measure cross-source presence.
  const byCategory = new Map<string, Map<string, number>>();
  const categories: SkillSource[] = ["career", "github", "learning", "tech", "tools"];

  for (const category of categories) {
    const items = current.filter((i) => categoryToSource(i.category) === category);
    const skills = extractSkills(items);
    const counts = new Map<string, number>();
    for (const [name, acc] of skills) counts.set(name, acc.count);
    byCategory.set(category, counts);
  }

  // Aggregate per-skill source breakdown.
  const techSources = new Map<string, EmergingTechSource[]>();
  for (const [category, counts] of byCategory) {
    for (const [name, count] of counts) {
      const existing = techSources.get(name) ?? [];
      existing.push({ category: category as SkillSource, count });
      techSources.set(name, existing);
    }
  }

  const previousSkills = extractSkills(previous);
  const result: { tech: EmergingTech; score: number }[] = [];

  const SOURCE_LABELS: Record<SkillSource, string> = {
    career: "jobs",
    github: "repositories",
    learning: "learning",
    tech: "articles",
    tools: "tools",
  };

  for (const [name, sources] of techSources) {
    const breadth = sources.length;
    const totalCount = sources.reduce((sum, s) => sum + s.count, 0);
    const prevCount = previousSkills.get(name)?.count ?? 0;
    const trend = computeTrend(totalCount, prevCount);
    const rising = trend === "new" || trend === "up";

    // Emerging = momentum, not raw volume. Surface a technology if it spans
    // multiple sources OR is newly rising — that's what differentiates this from
    // the volume-ranked Skill Radar. Cross-source items rank highest.
    if (breadth < 2 && !rising) continue;

    // Confidence leans on cross-source breadth, with a momentum contribution so a
    // single-source breakout still reads as "Early" rather than absent.
    const breadthScore = Math.min(breadth / 3, 1);
    const momentumScore = trend === "new" ? 1 : trend === "up" ? 0.7 : trend === "stable" ? 0.3 : 0;
    const confidence = Math.min(breadthScore * 0.6 + momentumScore * 0.4, 1);

    const sortedSources = sources.sort((a, b) => b.count - a.count);
    const sourceList = sortedSources.map((s) => SOURCE_LABELS[s.category]).join(", ");
    const description =
      breadth >= 2
        ? `${name} is appearing across ${breadth} data sources (${sourceList}) — broad, cross-domain momentum.`
        : `${name} is ${trend === "new" ? "newly surfacing" : "gaining momentum"} in ${sourceList}, an early signal worth watching.`;

    result.push({
      tech: { name, confidence, sources: sortedSources, trend, description },
      score: breadth * 10 + momentumScore * 3 + Math.min(totalCount, 8),
    });
  }

  return result
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map((entry) => entry.tech);
}

export async function getEmergingTech(): Promise<{ data: EmergingTechResponse; cached: boolean }> {
  return withCache("opportunity-intel:emerging", CACHE_TTL.EMERGING_TECH, async () => {
    const [current, previous] = await Promise.all([
      loadContentWindow({ fromDays: 14, toDays: 0 }),
      loadContentWindow({ fromDays: 28, toDays: 14 }),
    ]);

    return {
      technologies: buildEmergingTech(current, previous),
      generatedAt: new Date().toISOString(),
    };
  });
}

// --- Module 4: Opportunity Map ---------------------------------------------

function careerRowToOpportunity(item: ContentItemRow): SnapshotOpportunity {
  return {
    id: item.id,
    title: item.title,
    company: (item.metadata?.company as string) || item.author || "Unknown",
    type: (item.metadata?.type as string) || "job",
    url: item.url ?? undefined,
    publishedAt: item.published_at ?? item.created_at,
  };
}

function buildOpportunityAnalytics(
  career: ContentItemRow[],
  careerPrev: ContentItemRow[],
  trackedUrls: Set<string>
): OpportunityAnalytics {
  const untracked = career.filter((i) => !(i.url && trackedUrls.has(i.url)));

  // By category (opportunity type).
  const typeCounts = new Map<string, number>();
  for (const item of career) {
    const type = (item.metadata?.type as string) || "job";
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
  }
  const byCategory = [...typeCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Top skills with trend.
  const currentSkills = extractSkills(career);
  const prevSkills = extractSkills(careerPrev);
  const topSkills = [...currentSkills.entries()]
    .map(([skill, acc]) => ({
      skill,
      count: acc.count,
      trend: computeTrend(acc.count, prevSkills.get(skill)?.count ?? 0),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Recommended: rank untracked opportunities by in-demand skill overlap.
  const skillWeight = new Map<string, number>();
  for (const [skill, acc] of currentSkills) skillWeight.set(skill, acc.count);
  const scored = untracked
    .map((item) => {
      let score = 0;
      for (const tag of item.tags ?? []) {
        const def = matchSkill(tag);
        if (def) score += skillWeight.get(def.name) ?? 0;
      }
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  return {
    totalActive: untracked.length,
    byCategory,
    topSkills,
    recentOpportunities: untracked.slice(0, 10).map(careerRowToOpportunity),
    recommendedOpportunities: scored.slice(0, 6).map((s) => careerRowToOpportunity(s.item)),
  };
}

export async function getOpportunityAnalytics(
  userId?: string
): Promise<{ data: OpportunityMapResponse; cached: boolean }> {
  const cacheKey = `opportunity-intel:opportunities:${userId ?? "anon"}`;
  return withCache(cacheKey, CACHE_TTL.OPPORTUNITY_MAP, async () => {
    const [career, careerPrev] = await Promise.all([
      loadContentWindow({ fromDays: 14, toDays: 0, category: "career" }),
      loadContentWindow({ fromDays: 28, toDays: 14, category: "career" }),
    ]);

    let trackedUrls = new Set<string>();
    if (userId) {
      try {
        const supabase = await createClient();
        const { data } = await supabase
          .from("opportunity_tracker")
          .select("url")
          .eq("user_id", userId)
          .not("url", "is", null);
        trackedUrls = new Set((data ?? []).map((r) => r.url as string));
      } catch {
        // best-effort; fall back to empty set
      }
    }

    return {
      analytics: buildOpportunityAnalytics(career, careerPrev, trackedUrls),
      generatedAt: new Date().toISOString(),
    };
  });
}

// --- Module 5: Build This Next ---------------------------------------------

function scoreTemplate(
  template: ProjectTemplate,
  available: { skills: boolean; repos: boolean; tools: boolean }
): number {
  let score = 0;
  for (const slot of template.requiredSlots) {
    if (slot.startsWith("skill") && available.skills) score += 1;
    else if (slot.startsWith("repo") && available.repos) score += 1;
    else if (slot.startsWith("tool") && available.tools) score += 1;
    else score -= 1; // required slot has no data — penalize
  }
  return score;
}

function buildProjectIdeas(
  skills: SkillEntry[],
  repos: SnapshotRepo[],
  toolCategories: string[]
): { featured: ProjectIdea | null; ideas: ProjectIdea[] } {
  const available = {
    skills: skills.length > 0,
    repos: repos.length > 0,
    tools: toolCategories.length > 0,
  };

  const ranked = PROJECT_TEMPLATES.map((template) => ({
    template,
    score: scoreTemplate(template, available),
  }))
    .filter((t) => t.score >= 0)
    .sort((a, b) => b.score - a.score);

  const ideas: ProjectIdea[] = ranked.slice(0, 9).map((entry, index) =>
    fillTemplate(entry.template, { skills, repos, toolCategories, index, featured: index === 0 })
  );

  return {
    featured: ideas[0] ?? null,
    ideas: ideas.slice(1),
  };
}

export async function getBuildNextIdeas(): Promise<{ data: BuildNextResponse; cached: boolean }> {
  return withCache("opportunity-intel:build", CACHE_TTL.BUILD_NEXT, async () => {
    const [skillRadar, snapshot, tools] = await Promise.all([
      getSkillRadar(),
      getOrCreateTodaySnapshot(),
      loadContentWindow({ fromDays: 14, toDays: 0, category: "tools", limit: 100 }),
    ]);

    const toolCategories = [
      ...new Set(
        tools
          .map((t) => t.metadata?.toolCategory)
          .filter((c): c is string => typeof c === "string")
      ),
    ];

    const { featured, ideas } = buildProjectIdeas(
      skillRadar.data.skills,
      snapshot.data.repositories,
      toolCategories
    );

    return {
      featured,
      ideas,
      generatedAt: new Date().toISOString(),
    };
  });
}
