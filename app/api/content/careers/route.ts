import { NextRequest, NextResponse } from "next/server";
import { fetchFromProviders } from "@/lib/providers/base";
import { careerProviders } from "@/lib/providers/careers";
import { summarizeArticles } from "@/lib/ai/summarizer";
import { getCached, setCached, CACHE_TTL } from "@/lib/utils/cache";
import type { CareerOpportunity } from "@/types/content";

const CACHE_KEY = "content:careers";

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "true";

  let opportunities = refresh ? null : await getCached<CareerOpportunity[]>(CACHE_KEY);
  let cached = !!opportunities;
  let errors: { provider: string; error: string }[] = [];

  if (!opportunities) {
    const fetched = await fetchFromProviders<CareerOpportunity>(careerProviders);
    errors = fetched.errors;
    opportunities = fetched.items.length > 0 ? await summarizeArticles(fetched.items) : [];
    if (opportunities.length > 0) {
      await setCached(CACHE_KEY, opportunities, CACHE_TTL.CAREERS);
    }
    cached = false;
  }

  const types = Array.from(new Set(opportunities.map((o) => o.metadata.type)));

  return NextResponse.json({
    data: opportunities,
    types,
    cached,
    errors: errors.length > 0 ? errors : undefined,
  });
}
