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

  let body: { body?: string; tags?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const noteBody = body.body?.trim();
  if (!noteBody) {
    return NextResponse.json({ error: "Note body is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    body: noteBody,
    updated_at: new Date().toISOString(),
  };

  if (body.tags !== undefined) {
    updates.tags = body.tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
  }

  const { data, error } = await supabase
    .from("notes")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*, content:content_items(title, url, category)")
    .maybeSingle();

  if (error) {
    console.error("[notes]", error.message);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: data.id,
      userId: data.user_id,
      contentItemId: data.content_item_id,
      opportunityId: data.opportunity_id,
      body: data.body,
      tags: data.tags ?? [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      target: {
        title: data.content?.title ?? "Untitled",
        url: data.content?.url ?? null,
        category: data.content?.category ?? null,
      },
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

  const { error } = await supabase.from("notes").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    console.error("[notes]", error.message);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
