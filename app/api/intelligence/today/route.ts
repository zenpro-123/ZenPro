import { NextResponse } from "next/server";
import { getOrCreateTodaySnapshot } from "@/lib/intelligence/snapshot-service";
import { checkRateLimit } from "@/lib/api/with-rate-limit";

export async function GET() {
  const limited = await checkRateLimit();
  if (limited) return limited;

  const { data, cached } = await getOrCreateTodaySnapshot();

  return NextResponse.json({
    data: { topStories: data.topStories, generatedAt: data.generatedAt },
    cached,
  });
}
