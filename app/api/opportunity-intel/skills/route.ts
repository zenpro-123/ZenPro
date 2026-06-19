import { NextResponse } from "next/server";
import { getSkillRadar } from "@/lib/intelligence/opportunity-intel";

export async function GET() {
  const { data, cached } = await getSkillRadar();
  return NextResponse.json({ data, cached });
}
