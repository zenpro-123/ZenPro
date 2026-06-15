import { GoogleGenAI } from "@google/genai";
import { getOpenAI, AI_MODEL } from "@/lib/openai/client";

const GEMINI_MODEL = "gemini-2.5-flash";

let geminiClient: GoogleGenAI | null | undefined;

function getGemini(): GoogleGenAI | null {
  if (geminiClient !== undefined) return geminiClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    geminiClient = null;
    return geminiClient;
  }

  geminiClient = new GoogleGenAI({ apiKey });
  return geminiClient;
}

/** True if either Gemini or OpenAI is configured. */
export function hasAIProvider(): boolean {
  return !!process.env.GEMINI_API_KEY || !!process.env.OPENAI_API_KEY;
}

/**
 * Unified JSON-completion helper. Tries Gemini first (free tier), falls back to
 * OpenAI, and returns `null` if neither is configured or both fail — callers
 * already have deterministic non-AI fallbacks.
 */
export async function generateJSON<T>(systemPrompt: string, userPrompt: string): Promise<T | null> {
  const gemini = getGemini();
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (text) return JSON.parse(text) as T;
    } catch {
      // fall through to OpenAI
    }
  }

  const openai = getOpenAI();
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (raw) return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  return null;
}
