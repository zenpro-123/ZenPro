import { NextRequest, NextResponse } from "next/server";
import { techRssProvider } from "@/lib/providers/rss";
import { summarizeArticles } from "@/lib/ai/summarizer";
import { getCached, setCached, CACHE_TTL } from "@/lib/utils/cache";
import type { TechArticle } from "@/types/content";

const CACHE_KEY = "content:tech";

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "true";

  let articles = refresh ? null : await getCached<TechArticle[]>(CACHE_KEY);
  let cached = !!articles;

  if (!articles) {
    const result = await techRssProvider.fetch();
    articles = await summarizeArticles(result.data);
    await setCached(CACHE_KEY, articles, CACHE_TTL.TECH_NEWS);
    cached = false;
  }

  const sources = Array.from(new Set(articles.map((a) => a.source)));

  return NextResponse.json({ data: articles, sources, cached });
}
