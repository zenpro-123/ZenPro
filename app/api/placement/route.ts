import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("opportunity_tracker")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map((row) => mapRow(row as OpportunityRow)) });
}

export async function POST(request: NextRequest) {
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

  const title = body.title?.trim();
  if (!title || title.length > 200) {
    return NextResponse.json(
      { error: "Title is required and must be 200 characters or fewer" },
      { status: 400 }
    );
  }

  const status = (body.status ?? "interested") as OpportunityStatus;
  if (!OPPORTUNITY_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("opportunity_tracker")
    .insert({
      user_id: user.id,
      title,
      company: body.company?.trim() || null,
      url: body.url?.trim() || null,
      opportunity_type: body.opportunityType?.trim() || null,
      status,
      notes: body.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: mapRow(data as OpportunityRow) }, { status: 201 });
}
