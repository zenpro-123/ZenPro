import { NextRequest, NextResponse } from "next/server";
import { fetchFromProviders } from "@/lib/providers/base";
import { learningProviders } from "@/lib/providers/learning";
import { getCached, setCached, CACHE_TTL } from "@/lib/utils/cache";
import type { LearningArticle } from "@/types/content";

const CACHE_KEY = "content:learning";

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "true";

  let articles = refresh ? null : await getCached<LearningArticle[]>(CACHE_KEY);
  let cached = !!articles;

  if (!articles) {
    const fetched = await fetchFromProviders<LearningArticle>(learningProviders);
    articles = fetched.items;
    await setCached(CACHE_KEY, articles, CACHE_TTL.LEARNING);
    cached = false;
  }

  const sources = Array.from(new Set(articles.map((a) => a.source)));

  return NextResponse.json({ data: articles, sources, cached });
}
