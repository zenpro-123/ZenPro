import { NextResponse } from "next/server";
import { getCareerSignals } from "@/lib/intelligence/opportunity-intel";

export async function GET() {
  const { data, cached } = await getCareerSignals();
  return NextResponse.json({ data, cached });
}
