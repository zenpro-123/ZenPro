import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EVENT_TYPES, type TrackEventPayload } from "@/types/events";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<TrackEventPayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.eventType || !EVENT_TYPES.includes(body.eventType)) {
    return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
  }

  const { error } = await supabase.from("user_events").insert({
    user_id: user.id,
    event_type: body.eventType,
    item_id: body.itemId,
    properties: body.properties ?? {},
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
