import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const noteId = request.nextUrl.searchParams.get("noteId");
  const contentItemId = request.nextUrl.searchParams.get("contentItemId");

  if (!noteId && !contentItemId) {
    return NextResponse.json({ error: "noteId or contentItemId is required" }, { status: 400 });
  }

  if (noteId) {
    const { data: note } = await supabase
      .from("notes")
      .select("id, content_item_id")
      .eq("id", noteId)
      .eq("user_id", user.id)
      .single();

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const backlinks: Array<{
      noteId: string;
      noteBody: string;
      noteCreatedAt: string;
      sourceType: string;
      sourceTitle: string;
    }> = [];

    if (note.content_item_id) {
      const { data: relatedNotes } = await supabase
        .from("notes")
        .select("id, body, created_at, content_items(title)")
        .eq("user_id", user.id)
        .eq("content_item_id", note.content_item_id)
        .neq("id", noteId)
        .order("created_at", { ascending: false })
        .limit(10);

      for (const related of relatedNotes ?? []) {
        const content = Array.isArray(related.content_items)
          ? related.content_items[0]
          : related.content_items;
        backlinks.push({
          noteId: related.id,
          noteBody: related.body.slice(0, 120),
          noteCreatedAt: related.created_at,
          sourceType: "content_item",
          sourceTitle: (content as { title: string } | null)?.title ?? "Untitled",
        });
      }
    }

    return NextResponse.json({ backlinks });
  }

  if (contentItemId) {
    const { data: notes } = await supabase
      .from("notes")
      .select("id, body, created_at, content_items(title)")
      .eq("user_id", user.id)
      .eq("content_item_id", contentItemId)
      .order("created_at", { ascending: false })
      .limit(20);

    const backlinks = (notes ?? []).map((note) => {
      const content = Array.isArray(note.content_items)
        ? note.content_items[0]
        : note.content_items;
      return {
        noteId: note.id,
        noteBody: note.body.slice(0, 120),
        noteCreatedAt: note.created_at,
        sourceType: "note" as const,
        sourceTitle: (content as { title: string } | null)?.title ?? "Untitled",
      };
    });

    return NextResponse.json({ backlinks });
  }

  return NextResponse.json({ backlinks: [] });
}
