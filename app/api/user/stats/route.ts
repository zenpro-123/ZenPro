import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/api/with-rate-limit";

export interface UserStats {
  savedCount: number;
  notesCount: number;
  applicationsCount: number;
}

/** Lightweight activity counts for the profile page — head-only count queries
 *  (no rows transferred), scoped to the current user by RLS + explicit filter. */
export async function GET() {
  const limited = await checkRateLimit();
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = async (table: string) => {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (error) {
      console.error(`[user-stats] ${table}`, error.message);
      return 0;
    }
    return count ?? 0;
  };

  const [savedCount, notesCount, applicationsCount] = await Promise.all([
    count("saved_items"),
    count("notes"),
    count("opportunity_tracker"),
  ]);

  const stats: UserStats = { savedCount, notesCount, applicationsCount };
  return NextResponse.json({ data: stats });
}
