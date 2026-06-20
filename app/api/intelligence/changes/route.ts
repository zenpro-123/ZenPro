import { NextResponse } from "next/server";
import { getOrCreateTodaySnapshot, getSnapshot } from "@/lib/intelligence/snapshot-service";
import { checkRateLimit } from "@/lib/api/with-rate-limit";
import { computeWhatChanged } from "@/lib/intelligence/diff-service";

function yesterdayDate(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  const limited = await checkRateLimit();
  if (limited) return limited;

  const { data: today } = await getOrCreateTodaySnapshot();
  const yesterday = await getSnapshot(yesterdayDate());

  return NextResponse.json({ data: computeWhatChanged(today, yesterday) });
}
