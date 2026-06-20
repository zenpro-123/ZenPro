import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/api/with-rate-limit";
import { OPPORTUNITY_STATUSES, type OpportunityEntry, type OpportunityStatus } from "@/types/placement";

interface OpportunityRow {
  id: string;
  title: string;
  company: string | null;
  url: string | null;
  opportunity_type: string | null;
  status: OpportunityStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: OpportunityRow): OpportunityEntry {
  return {
    id: row.id,
    title: row.title,
    company: row.company ?? undefined,
    url: row.url ?? undefined,
    opportunityType: row.opportunity_type ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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

  let body: {
    title?: string;
    company?: string;
    url?: string;
    opportunityType?: string;
    status?: string;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) {
    const title = body.title.trim();
    if (!title || title.length > 200) {
      return NextResponse.json({ error: "Title must be 1–200 characters" }, { status: 400 });
    }
    update.title = title;
  }
  if (body.status !== undefined) {
    if (!OPPORTUNITY_STATUSES.includes(body.status as OpportunityStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = body.status;
  }
  if (body.company !== undefined) update.company = body.company.trim() || null;
  if (body.url !== undefined) update.url = body.url.trim() || null;
  if (body.opportunityType !== undefined) update.opportunity_type = body.opportunityType.trim() || null;
  if (body.notes !== undefined) update.notes = body.notes.trim() || null;

  const { data, error } = await supabase
    .from("opportunity_tracker")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[placement]", error.message);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }

  return NextResponse.json({ data: mapRow(data as OpportunityRow) });
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

  const { error } = await supabase
    .from("opportunity_tracker")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[placement]", error.message);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
