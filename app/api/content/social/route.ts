import { NextResponse } from "next/server";
import { fetchFromProviders } from "@/lib/providers/base";
import { socialProviders } from "@/lib/providers/social";
import type { SocialTrend } from "@/types/content";

export async function GET() {
  const result = await fetchFromProviders<SocialTrend>(socialProviders);

  return NextResponse.json({
    data: result.items,
    cached: false,
    errors: result.errors.length > 0 ? result.errors : undefined,
  });
}
