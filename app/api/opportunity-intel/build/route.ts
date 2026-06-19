import { NextResponse } from "next/server";
import { getBuildNextIdeas } from "@/lib/intelligence/opportunity-intel";

export async function GET() {
  const { data, cached } = await getBuildNextIdeas();
  return NextResponse.json({ data, cached });
}
