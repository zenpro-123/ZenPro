import OpenAI from "openai";

let client: OpenAI | null | undefined;

/**
 * Returns the OpenAI client, or `null` if `OPENAI_API_KEY` isn't configured.
 * AI features degrade gracefully (skip summarization, show raw content) when
 * this returns `null`.
 */
export function getOpenAI(): OpenAI | null {
  if (client !== undefined) return client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    client = null;
    return client;
  }

  client = new OpenAI({ apiKey });
  return client;
}

export const AI_MODEL = "gpt-4o-mini";
