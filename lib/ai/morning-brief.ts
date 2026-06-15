import { getOpenAI, AI_MODEL } from "@/lib/openai/client";
import type { MorningBrief, MorningDevelopment } from "@/types/ai";
import type { TechArticle } from "@/types/content";

interface MorningBriefContext {
  name?: string | null;
  interests: string[];
}

/** ~225 wpm reading speed, floored at 15s. */
function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(15, Math.round((words / 225) * 60));
}

function buildGreeting(name?: string | null): string {
  const hour = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const namePart = name ? `, ${name.split(" ")[0]}` : "";
  return `Good ${period}${namePart}`;
}

const SYSTEM_PROMPT = `You are ZenPro's morning intelligence editor. Given a list of recent tech news articles and a user's interests, select and synthesize the 5 most important developments for that user. Respond ONLY with JSON matching this shape:
{"headline": string, "developments": [{"title": string, "summary": string, "whyItMatters": string, "category": string}]}
Keep "summary" to 1-2 sentences and "whyItMatters" to a single sentence. "headline" is one punchy sentence capturing the day's biggest theme. Prefer developments relevant to the user's interests when present.`;

function buildUserPrompt(articles: TechArticle[], context: MorningBriefContext): string {
  const interestLine = context.interests.length
    ? `User interests: ${context.interests.join(", ")}.\n\n`
    : "";
  const list = articles
    .map((a, i) => `${i + 1}. [${a.source}] ${a.title} — ${a.summary ?? ""}`)
    .join("\n");
  return `${interestLine}Recent articles:\n${list}`;
}

function fallbackBrief(greeting: string, date: string, articles: TechArticle[]): MorningBrief {
  const developments: MorningDevelopment[] = articles.slice(0, 5).map((a) => ({
    title: a.title,
    summary: a.summary ?? "",
    whyItMatters: `Reported by ${a.source}.`,
    category: "tech",
    sourceUrl: a.url,
  }));

  const readingTimeSeconds = developments.reduce(
    (sum, d) => sum + estimateReadingTime(`${d.title} ${d.summary}`),
    0
  );

  return {
    greeting,
    date,
    headline:
      developments.length > 0
        ? "Here's what's moving in tech right now."
        : "No fresh updates yet — check back soon.",
    developments,
    readingTimeSeconds: Math.max(readingTimeSeconds, 30),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generates Module 2's personalized "Good Morning" brief. Falls back to a
 * non-AI digest (raw headlines, no synthesis) when OpenAI isn't configured
 * or returns no usable output — the data is always real, AI just adds polish.
 */
export async function generateMorningBrief(
  articles: TechArticle[],
  context: MorningBriefContext
): Promise<MorningBrief> {
  const greeting = buildGreeting(context.name);
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const top = articles.slice(0, 8);

  const openai = getOpenAI();
  if (!openai || top.length === 0) {
    return fallbackBrief(greeting, date, top);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(top, context) },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallbackBrief(greeting, date, top);

    const parsed = JSON.parse(raw) as {
      headline?: string;
      developments?: Partial<MorningDevelopment>[];
    };

    const developments: MorningDevelopment[] = (parsed.developments ?? [])
      .slice(0, 5)
      .map((d, i) => ({
        title: d.title ?? top[i]?.title ?? "Update",
        summary: d.summary ?? "",
        whyItMatters: d.whyItMatters ?? "",
        category: d.category ?? "tech",
        sourceUrl: top[i]?.url,
      }));

    if (developments.length === 0) return fallbackBrief(greeting, date, top);

    const readingTimeSeconds = developments.reduce(
      (sum, d) => sum + estimateReadingTime(`${d.summary} ${d.whyItMatters}`),
      0
    );

    return {
      greeting,
      date,
      headline: parsed.headline ?? "Your daily intelligence briefing is ready.",
      developments,
      readingTimeSeconds: Math.max(readingTimeSeconds, 30),
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return fallbackBrief(greeting, date, top);
  }
}
