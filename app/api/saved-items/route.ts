import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveContentItemId } from "@/lib/content/resolve-content-item";
import type { ContentItemRow } from "@/types/recommendation";
import type { SavedItemWithContent, SaveItemPayload } from "@/types/saved";

interface SavedItemRow {
  id: string;
  user_id: string;
  item_id: string;
  collection_id: string | null;
  tags: string[];
  created_at: string;
  content: ContentItemRow;
}

function mapRow(row: SavedItemRow): SavedItemWithContent {
  return {
    id: row.id,
    userId: row.user_id,
    itemId: row.item_id,
    collectionId: row.collection_id,
    tags: row.tags,
    createdAt: row.created_at,
    content: row.content,
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
  const collectionId = searchParams.get("collectionId");
  const tag = searchParams.get("tag");
  const q = searchParams.get("q")?.trim().toLowerCase();

  const { data, error } = await supabase
    .from("saved_items")
    .select("*, content:content_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let items = (data ?? []) as unknown as SavedItemRow[];

  if (collectionId === "uncategorized") {
    items = items.filter((row) => !row.collection_id);
  } else if (collectionId) {
    items = items.filter((row) => row.collection_id === collectionId);
  }

  if (tag) {
    items = items.filter((row) => row.tags?.includes(tag));
  }

  if (q) {
    items = items.filter((row) => row.content?.title?.toLowerCase().includes(q));
  }

  return NextResponse.json({ data: items.map(mapRow) });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SaveItemPayload & { collectionId?: string | null; tags?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.contentHash || !body.source || !body.category || !body.title) {
    return NextResponse.json(
      { error: "contentHash, source, category, and title are required" },
      { status: 400 }
    );
  }

  let itemId: string;
  try {
    itemId = await resolveContentItemId(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to resolve content item" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("saved_items")
    .upsert(
      {
        user_id: user.id,
        item_id: itemId,
        collection_id: body.collectionId ?? null,
        tags: body.tags ?? [],
      },
      { onConflict: "user_id,item_id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      data: {
        id: data.id,
        userId: data.user_id,
        itemId: data.item_id,
        collectionId: data.collection_id,
        tags: data.tags,
        createdAt: data.created_at,
      },
    },
    { status: 201 }
  );
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentHash = request.nextUrl.searchParams.get("contentHash");
  if (!contentHash) {
    return NextResponse.json({ error: "contentHash query parameter is required" }, { status: 400 });
  }

  const { data: contentItem, error: contentError } = await supabase
    .from("content_items")
    .select("id")
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (contentError) {
    return NextResponse.json({ error: contentError.message }, { status: 500 });
  }

  if (!contentItem) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("saved_items")
    .delete()
    .eq("user_id", user.id)
    .eq("item_id", contentItem.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
