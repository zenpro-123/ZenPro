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

  let body: { collectionId?: string | null; tags?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if ("collectionId" in body) update.collection_id = body.collectionId;
  if ("tags" in body) update.tags = body.tags;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("saved_items")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[saved-items]", error.message);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Saved item not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: data.id,
      userId: data.user_id,
      itemId: data.item_id,
      collectionId: data.collection_id,
      tags: data.tags,
      createdAt: data.created_at,
    },
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

  const { error } = await supabase.from("saved_items").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    console.error("[saved-items]", error.message);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
