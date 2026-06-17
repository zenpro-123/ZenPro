import { NextRequest, NextResponse } from "next/server";
import { fetchFromProviders } from "@/lib/providers/base";
import { toolProviders } from "@/lib/providers/tools";
import { getCached, setCached, CACHE_TTL } from "@/lib/utils/cache";
import type { Tool } from "@/types/content";

const CACHE_KEY = "content:tools";

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "true";

  let tools = refresh ? null : await getCached<Tool[]>(CACHE_KEY);
  let cached = !!tools;

  if (!tools) {
    const fetched = await fetchFromProviders<Tool>(toolProviders);
    tools = fetched.items;
    await setCached(CACHE_KEY, tools, CACHE_TTL.TOOLS);
    cached = false;
  }

  const categories = Array.from(new Set(tools.map((t) => t.metadata.toolCategory)));

  return NextResponse.json({ data: tools, categories, cached });
}
