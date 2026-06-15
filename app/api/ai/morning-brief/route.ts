import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCached, setCached, CACHE_TTL } from "@/lib/utils/cache";
import { techRssProvider } from "@/lib/providers/rss";
import { generateMorningBrief } from "@/lib/ai/morning-brief";
import type { MorningBrief } from "@/types/ai";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const refresh = request.nextUrl.searchParams.get("refresh") === "true";
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `brief:${user.id}:${today}`;

  let brief = refresh ? null : await getCached<MorningBrief>(cacheKey);
  let cached = !!brief;

  if (!brief) {
    const [{ data: profile }, { data: prefs }] = await Promise.all([
      supabase.from("profiles").select("name").eq("id", user.id).single(),
      supabase.from("user_preferences").select("interests").eq("user_id", user.id).maybeSingle(),
    ]);

    const { data: articles } = await techRssProvider.fetch();
    brief = await generateMorningBrief(articles, {
      name: profile?.name,
      interests: prefs?.interests ?? [],
    });
    await setCached(cacheKey, brief, CACHE_TTL.MORNING_BRIEF);
    cached = false;
  }

  return NextResponse.json({ data: brief, cached });
}
