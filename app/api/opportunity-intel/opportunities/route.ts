import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpportunityAnalytics } from "@/lib/intelligence/opportunity-intel";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, cached } = await getOpportunityAnalytics(user?.id);
  return NextResponse.json({ data, cached });
}
