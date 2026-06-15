import { NextResponse } from "next/server";
import { getOrCreateTodaySnapshot } from "@/lib/intelligence/snapshot-service";

export async function GET() {
  const { data, cached } = await getOrCreateTodaySnapshot();

  return NextResponse.json({
    data: { topStories: data.topStories, generatedAt: data.generatedAt },
    cached,
  });
}
