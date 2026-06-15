import { getOpenAI, AI_MODEL } from "@/lib/openai/client";
import type { ContentItem } from "@/types/content";

const SYSTEM_PROMPT = `You are ZenPro's tech analyst. For each article (indexed from 0), produce a one-sentence summary and three structured insights: whatHappened, whyItMatters, implications — each a single concise sentence. Respond ONLY with JSON matching:
{"items": [{"index": number, "summary": string, "whatHappened": string, "whyItMatters": string, "implications": string}]}`;

function buildPrompt(articles: { title: string; summary?: string; source: string }[]): string {
  const list = articles
    .map((a, i) => `${i}. [${a.source}] ${a.title} — ${a.summary ?? ""}`)
    .join("\n");
  return `Articles:\n${list}`;
}

/**
 * Adds `aiSummary` + `aiInsights` to the first `limit` items via a single
 * batched GPT-4o-mini call. Falls back to returning items unchanged when
 * OpenAI isn't configured or the call fails — the underlying content is
 * always real, AI only adds the "Detailed mode" layer on top.
 */
export async function summarizeArticles<T extends ContentItem<object>>(
  items: T[],
  limit = 6
): Promise<T[]> {
  const openai = getOpenAI();
  if (!openai || items.length === 0) return items;

  const toSummarize = items.slice(0, limit);
  const rest = items.slice(limit);

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildPrompt(toSummarize.map((a) => ({ title: a.title, summary: a.summary, source: a.source }))),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return items;

    const parsed = JSON.parse(raw) as {
      items?: { index: number; summary: string; whatHappened: string; whyItMatters: string; implications: string }[];
    };

    const summarized = toSummarize.map((item, i) => {
      const entry = parsed.items?.find((p) => p.index === i);
      if (!entry) return item;
      return {
        ...item,
        aiSummary: entry.summary,
        aiInsights: {
          whatHappened: entry.whatHappened,
          whyItMatters: entry.whyItMatters,
          implications: entry.implications,
        },
      };
    });

    return [...summarized, ...rest];
  } catch {
    return items;
  }
}
