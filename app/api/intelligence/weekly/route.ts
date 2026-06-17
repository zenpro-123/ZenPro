import { NextResponse } from "next/server";
import { getWeeklyReview } from "@/lib/intelligence/weekly-review-service";

export async function GET() {
  const { data, cached } = await getWeeklyReview();

  return NextResponse.json({ data, cached });
}
