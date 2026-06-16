import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Collection } from "@/types/saved";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: collections, error: collectionsError }, { data: savedItems, error: savedError }] =
    await Promise.all([
      supabase.from("collections").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("saved_items").select("collection_id").eq("user_id", user.id),
    ]);

  if (collectionsError) {
    return NextResponse.json({ error: collectionsError.message }, { status: 500 });
  }
  if (savedError) {
    return NextResponse.json({ error: savedError.message }, { status: 500 });
  }

  const counts = new Map<string, number>();
  for (const row of savedItems ?? []) {
    if (!row.collection_id) continue;
    counts.set(row.collection_id, (counts.get(row.collection_id) ?? 0) + 1);
  }

  const data: Collection[] = (collections ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    itemCount: counts.get(row.id) ?? 0,
  }));

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
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
    .insert({ user_id: user.id, name })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A collection with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const collection: Collection = {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    createdAt: data.created_at,
    itemCount: 0,
  };

  return NextResponse.json({ data: collection }, { status: 201 });
}
