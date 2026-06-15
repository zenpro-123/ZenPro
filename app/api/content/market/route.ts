import { NextRequest, NextResponse } from "next/server";
import { fetchFromProviders } from "@/lib/providers/base";
import { marketProviders } from "@/lib/providers/market";
import { generateMarketInsight } from "@/lib/ai/market-insight";
import { getCached, setCached, CACHE_TTL } from "@/lib/utils/cache";
import type { MarketItem, MarketInsight } from "@/types/market";

const CACHE_KEY = "content:market";

interface MarketCache {
  items: MarketItem[];
  insight: MarketInsight;
}

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "true";

  let result = refresh ? null : await getCached<MarketCache>(CACHE_KEY);
  let cached = !!result;
  let errors: { provider: string; error: string }[] = [];

  if (!result) {
    const fetched = await fetchFromProviders<MarketItem>(marketProviders);
    errors = fetched.errors;
    const insight = await generateMarketInsight(fetched.items);
    result = { items: fetched.items, insight };
    if (result.items.length > 0) {
      await setCached(CACHE_KEY, result, CACHE_TTL.MARKET);
    }
    cached = false;
  }

  return NextResponse.json({
    data: result.items,
    insight: result.insight,
    cached,
    errors: errors.length > 0 ? errors : undefined,
  });
}
