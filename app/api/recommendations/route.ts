import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/api/with-rate-limit";
import { getRecommendations } from "@/lib/recommendation/recommendation-engine";

export async function GET() {
  const limited = await checkRateLimit();
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getRecommendations(user.id);
  return NextResponse.json({ data });
}
