import { generateJSON } from "@/lib/ai/client";
import { dedupeByTitle } from "@/lib/utils/deduplication";
import type { DevelopmentImpact, TopDevelopment } from "@/types/ai";
import type { ContentItem } from "@/types/content";

/** Accepts any of the category-specific `ContentItem<...>` variants (tech, github, career, ...). */
type AnyContentItem = ContentItem<object>;

const SYSTEM_PROMPT = `You are ZenPro's intelligence editor. For each of the following stories (indexed from 0), write three short sentences — whatHappened, whyItMatters, implications — each under 15 words, plus an "impact" level ("high", "medium", or "low") reflecting how significant the story is. Respond ONLY with JSON matching:
{"items": [{"index": number, "whatHappened": string, "whyItMatters": string, "implications": string, "impact": "high"|"medium"|"low"}]}`;

interface DevelopmentAIResult {
  index: number;
  whatHappened: string;
  whyItMatters: string;
  implications: string;
  impact?: DevelopmentImpact;
}

interface DevelopmentAIResponse {
  items?: DevelopmentAIResult[];
}

/** Source-quality weights for the importance score. Unlisted sources default to 0.5. */
const SOURCE_WEIGHTS: Record<string, number> = {
  "The Verge": 0.9,
  TechCrunch: 0.9,
  GeekWire: 0.7,
  "Hacker News": 1,
  GitHub: 0.8,
  RemoteOK: 0.6,
};

/** Category baseline weights for the global "front page" — no personalization. */
const CATEGORY_BASELINE: Record<string, number> = {
  tech: 1,
  github: 0.8,
  career: 0.6,
};

function tokenize(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Recency decay (48h half-life) + source weight + popularity + category baseline. */
function scoreImportance(item: AnyContentItem, now: number): number {
  const hoursAgo = Math.max(0, (now - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60));
  const recencyScore = Math.pow(0.5, hoursAgo / 48);

  const sourceWeight = SOURCE_WEIGHTS[item.source] ?? 0.5;

  let popularityScore = 0.5;
  if (item.category === "github") {
    const starsToday = (item.metadata as { starsToday?: number }).starsToday ?? 0;
    popularityScore = Math.min(1, starsToday / 50);
  }

  const categoryBaseline = CATEGORY_BASELINE[item.category] ?? 0.5;

  return recencyScore * 0.35 + sourceWeight * 0.15 + popularityScore * 0.2 + categoryBaseline * 0.3;
}

interface Cluster {
  primary: AnyContentItem;
  score: number;
  relatedSources: string[];
}

/** Groups near-duplicate stories (by title token overlap) into clusters, ranked by score. */
function clusterByImportance(items: AnyContentItem[], now: number): Cluster[] {
  const scored = items
    .map((item) => ({ item, score: scoreImportance(item, now) }))
    .sort((a, b) => b.score - a.score);

  const clusters: Cluster[] = [];

  for (const { item, score } of scored) {
    const tokens = tokenize(item.title);
    const match = clusters.find((c) => jaccardSimilarity(tokenize(c.primary.title), tokens) >= 0.5);

    if (match) {
      match.relatedSources.push(item.source);
    } else {
      clusters.push({ primary: item, score, relatedSources: [] });
    }
  }

  return clusters;
}

function scoreToImpact(score: number): DevelopmentImpact {
  if (score > 0.7) return "high";
  if (score > 0.4) return "medium";
  return "low";
}

function fallbackWhatHappened(item: AnyContentItem): string {
  if (item.category === "github") {
    return item.summary ? `${item.title}: ${item.summary}` : `${item.title} is trending on GitHub.`;
  }
  if (item.category === "career") {
    const company = (item.metadata as { company?: string }).company ?? item.author ?? "A company";
    return `${company} posted a new opportunity: ${item.title}.`;
  }
  return item.summary ?? item.title;
}

function fallbackWhyItMatters(item: AnyContentItem): string {
  if (item.category === "github") {
    const starsToday = (item.metadata as { starsToday?: number }).starsToday ?? 0;
    return `Gaining roughly ${starsToday} stars per day.`;
  }
  if (item.category === "career") {
    return "A fresh opportunity worth considering.";
  }
  return `Reported by ${item.source}.`;
}

function fallbackImplications(item: AnyContentItem): string {
  if (item.category === "github") return "Worth a look if you work in this space.";
  if (item.category === "career") return "Apply soon if you're interested.";
  return "Keep an eye on how this story develops.";
}

function buildPrompt(items: AnyContentItem[]): string {
  const list = items
    .map((item, i) => `${i}. [${item.category}/${item.source}] ${item.title} — ${item.summary ?? ""}`)
    .join("\n");
  return `Stories:\n${list}`;
}

/** Trims text to ~`max` words so the combined reading time stays short. */
function trimWords(text: string, max: number): string {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);
  if (words.length <= max) return trimmed;
  return `${words.slice(0, max).join(" ")}…`;
}

/**
 * Dedupes/clusters near-duplicate stories, ranks them by a deterministic
 * importance score, and synthesizes the top 5 into "Things You Should Know
 * Today" — AI-summarized when available, deterministic templates otherwise.
 */
export async function buildTopDevelopments(items: AnyContentItem[]): Promise<TopDevelopment[]> {
  const deduped = dedupeByTitle(items);
  if (deduped.length === 0) return [];

  const now = Date.now();
  const clusters = clusterByImportance(deduped, now).slice(0, 5);

  const aiResponse = await generateJSON<DevelopmentAIResponse>(
    SYSTEM_PROMPT,
    buildPrompt(clusters.map((c) => c.primary))
  );

  return clusters.map((cluster, i) => {
    const primary = cluster.primary;
    const aiEntry = aiResponse?.items?.find((entry) => entry.index === i);

    const whatHappened = aiEntry?.whatHappened ?? fallbackWhatHappened(primary);
    const whyItMatters = aiEntry?.whyItMatters ?? fallbackWhyItMatters(primary);
    const implications = aiEntry?.implications ?? fallbackImplications(primary);
    const impact = aiEntry?.impact ?? scoreToImpact(cluster.score);

    return {
      id: primary.id,
      title: primary.title,
      whatHappened: trimWords(whatHappened, 15),
      whyItMatters: trimWords(whyItMatters, 15),
      implications: trimWords(implications, 15),
      impact,
      category: primary.category,
      source: primary.source,
      sourceUrl: primary.url,
      imageUrl: primary.imageUrl ?? undefined,
      relatedSources: cluster.relatedSources.length > 0 ? cluster.relatedSources : undefined,
    };
  });
}
