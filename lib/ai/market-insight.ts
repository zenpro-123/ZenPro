import { getOpenAI, AI_MODEL } from "@/lib/openai/client";
import { formatPercent } from "@/lib/utils/formatting";
import type { MarketItem, MarketInsight } from "@/types/market";

const SYSTEM_PROMPT = `You are ZenPro's markets analyst. Given a snapshot of index, crypto, commodity, and forex quotes, write a one-sentence summary of what's moving today and 2-4 short "watch items" (each a short phrase naming an asset and its move). Respond ONLY with JSON matching:
{"summary": string, "watchItems": string[]}`;

function buildPrompt(items: MarketItem[]): string {
  const lines = items
    .map((i) => `${i.displaySymbol} (${i.assetType}): ${i.price} ${i.currency}, ${formatPercent(i.changePercent)}`)
    .join("\n");
  return `Market snapshot:\n${lines}`;
}

/** Non-AI fallback: surface the largest absolute moves from the snapshot itself. */
function fallbackInsight(items: MarketItem[]): MarketInsight {
  const sorted = [...items].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  const top = sorted.slice(0, 3);

  return {
    summary:
      top.length > 0
        ? `${top[0].displaySymbol} leads today's moves at ${formatPercent(top[0].changePercent)}.`
        : "Markets are quiet right now.",
    watchItems: top.map((i) => `${i.displaySymbol} ${formatPercent(i.changePercent)}`),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * "What Investors Are Watching" — a one-sentence GPT-4o-mini summary plus a
 * handful of watch items derived from the current market snapshot. Falls
 * back to a non-AI summary of the largest movers when OpenAI is unavailable.
 */
export async function generateMarketInsight(items: MarketItem[]): Promise<MarketInsight> {
  const openai = getOpenAI();
  if (!openai || items.length === 0) return fallbackInsight(items);

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(items) },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallbackInsight(items);

    const parsed = JSON.parse(raw) as { summary?: string; watchItems?: string[] };
    if (!parsed.summary) return fallbackInsight(items);

    return {
      summary: parsed.summary,
      watchItems: parsed.watchItems ?? [],
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return fallbackInsight(items);
  }
}
