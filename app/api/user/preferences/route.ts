import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
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
    return NextResponse.json({ error: prefsError.message }, { status: 500 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarding_complete: true, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
