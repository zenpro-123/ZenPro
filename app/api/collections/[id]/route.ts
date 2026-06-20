import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/api/with-rate-limit";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await checkRateLimit();
  if (limited) return limited;

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name || name.length > 60) {
    return NextResponse.json(
      { error: "Collection name is required and must be 60 characters or fewer" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("collections")
    .update({ name })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A collection with this name already exists" }, { status: 409 });
    }
    console.error("[collections]", error.message);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: { id: data.id, userId: data.user_id, name: data.name, createdAt: data.created_at, itemCount: 0 },
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await checkRateLimit();
  if (limited) return limited;

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("collections").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    console.error("[collections]", error.message);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
