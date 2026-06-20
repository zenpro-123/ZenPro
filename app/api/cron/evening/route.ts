import { NextRequest, NextResponse } from "next/server";
import { generateSnapshot } from "@/lib/intelligence/snapshot-service";
import { setCached, CACHE_TTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = new Date().toISOString().slice(0, 10);
  const snapshot = await generateSnapshot(date);
  await setCached(`snapshot:${date}`, snapshot, CACHE_TTL.SNAPSHOT);

  return NextResponse.json({ ok: true, date });
}
