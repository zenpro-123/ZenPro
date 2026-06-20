import { NextResponse } from "next/server";
import { getWeeklyReview } from "@/lib/intelligence/weekly-review-service";
import { checkRateLimit } from "@/lib/api/with-rate-limit";

export async function GET() {
  const limited = await checkRateLimit();
  if (limited) return limited;

  const { data, cached } = await getWeeklyReview();

  return NextResponse.json({ data, cached });
}
