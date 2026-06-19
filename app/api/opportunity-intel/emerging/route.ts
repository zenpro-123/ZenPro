import { NextResponse } from "next/server";
import { getEmergingTech } from "@/lib/intelligence/opportunity-intel";

export async function GET() {
  const { data, cached } = await getEmergingTech();
  return NextResponse.json({ data, cached });
}
