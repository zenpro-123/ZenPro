import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveContentItemId } from "@/lib/content/resolve-content-item";
import type { NoteWithTarget } from "@/types/notes";
import type { SaveItemPayload } from "@/types/saved";

interface NoteRow {
  id: string;
  user_id: string;
  content_item_id: string | null;
  opportunity_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  content: { title: string; url: string | null } | null;
}

function mapRow(row: NoteRow): NoteWithTarget {
  return {
    id: row.id,
    userId: row.user_id,
    contentItemId: row.content_item_id,
    opportunityId: row.opportunity_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    target: {
      title: row.content?.title ?? "Untitled",
      url: row.content?.url ?? null,
    },
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const contentItemId = searchParams.get("contentItemId");
  const contentHash = searchParams.get("contentHash");

  let resolvedContentItemId = contentItemId;

  if (!resolvedContentItemId && contentHash) {
    const { data: contentItem, error: contentError } = await supabase
      .from("content_items")
      .select("id")
      .eq("content_hash", contentHash)
      .maybeSingle();

    if (contentError) {
      return NextResponse.json({ error: contentError.message }, { status: 500 });
    }

    if (!contentItem) {
      return NextResponse.json({ data: [] });
    }

    resolvedContentItemId = contentItem.id;
  }

  let query = supabase
    .from("notes")
    .select("*, content:content_items(title, url)")
    .eq("user_id", user.id)
    .is("opportunity_id", null)
    .order("created_at", { ascending: false });

  if (resolvedContentItemId) {
    query = query.eq("content_item_id", resolvedContentItemId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: ((data ?? []) as unknown as NoteRow[]).map(mapRow) });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { item?: SaveItemPayload; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const noteBody = body.body?.trim();
  if (!noteBody) {
    return NextResponse.json({ error: "Note body is required" }, { status: 400 });
  }

  const item = body.item;
  if (!item || !item.contentHash || !item.source || !item.category || !item.title) {
    return NextResponse.json(
      { error: "item with contentHash, source, category, and title is required" },
      { status: 400 }
    );
  }

  let contentItemId: string;
  try {
    contentItemId = await resolveContentItemId(item);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to resolve content item" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      content_item_id: contentItemId,
      opportunity_id: null,
      body: noteBody,
    })
    .select("*, content:content_items(title, url)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: mapRow(data as unknown as NoteRow) }, { status: 201 });
}
