import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/api/with-rate-limit";

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

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[preferences]", error.message);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const limited = await checkRateLimit();
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const {
    interests = [],
    favoriteTopics = [],
    favoriteCompanies = [],
    favoriteCreators = [],
    interestVector = {},
  } = body;

  const { error: prefsError } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      interests,
      favorite_topics: favoriteTopics,
      favorite_companies: favoriteCompanies,
      favorite_creators: favoriteCreators,
      interest_vector: interestVector,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (prefsError) {
    console.error("[preferences] upsert:", prefsError.message);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarding_complete: true, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (profileError) {
    console.error("[preferences] profile:", profileError.message);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
