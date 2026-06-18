import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type SearchResultType =
  | "content"
  | "saved"
  | "note"
  | "opportunity"
  | "review"
  | "tool"
  | "learning"
  | "timeline";

export interface SearchHit {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string | null;
  url?: string | null;
  href?: string | null;
  date?: string | null;
}

interface JoinedContent {
  title: string;
  url: string | null;
}

function firstContent(value: unknown): JoinedContent | null {
  const v = Array.isArray(value) ? value[0] : value;
  return (v as JoinedContent) ?? null;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();
  const like = `%${query}%`;
  const results: SearchHit[] = [];

  const contentPromise = supabase
    .from("content_items")
    .select("id, source, category, title, summary, url, published_at")
    .ilike("title", like)
    .order("published_at", { ascending: false })
    .limit(8);

  const toolsPromise = supabase
    .from("content_items")
    .select("id, title, summary, url, published_at")
    .eq("category", "tools")
    .ilike("title", like)
    .order("published_at", { ascending: false })
    .limit(5);

  const learningPromise = supabase
    .from("content_items")
    .select("id, title, summary, url, published_at")
    .eq("category", "learning")
    .ilike("title", like)
    .order("published_at", { ascending: false })
    .limit(5);

  const timelinePromise = supabase
    .from("daily_snapshots")
    .select("snapshot_date, top_stories")
    .order("snapshot_date", { ascending: false })
    .limit(30);

  const [contentRes, toolsRes, learningRes, timelineRes] = await Promise.all([
    contentPromise,
    toolsPromise,
    learningPromise,
    timelinePromise,
  ]);

  const seenIds = new Set<string>();

  for (const row of contentRes.data ?? []) {
    if (row.category === "tools" || row.category === "learning") continue;
    seenIds.add(row.id);
    results.push({
      id: row.id,
      type: "content",
      title: row.title,
      subtitle: row.summary,
      url: row.url,
    });
  }

  for (const row of toolsRes.data ?? []) {
    if (seenIds.has(row.id)) continue;
    seenIds.add(row.id);
    results.push({
      id: `tool:${row.id}`,
      type: "tool",
      title: row.title,
      subtitle: row.summary,
      url: row.url,
      href: "/tools",
    });
  }

  for (const row of learningRes.data ?? []) {
    if (seenIds.has(row.id)) continue;
    seenIds.add(row.id);
    results.push({
      id: `learn:${row.id}`,
      type: "learning",
      title: row.title,
      subtitle: row.summary,
      url: row.url,
      href: "/learning",
    });
  }

  for (const row of timelineRes.data ?? []) {
    const stories = (row.top_stories ?? []) as Array<{ id: string; title: string }>;
    const q = query.toLowerCase();
    for (const story of stories) {
      if (story.title.toLowerCase().includes(q)) {
        const key = `timeline:${row.snapshot_date}:${story.id}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          results.push({
            id: key,
            type: "timeline",
            title: story.title,
            subtitle: row.snapshot_date,
            href: "/timeline",
            date: row.snapshot_date,
          });
        }
      }
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const orSafe = query.replace(/[(),]/g, " ").trim();

    const [saved, notes, opportunities, reviews] = await Promise.all([
      supabase
        .from("saved_items")
        .select("id, content_items!inner(title, url)")
        .eq("user_id", user.id)
        .ilike("content_items.title", like)
        .limit(5),
      supabase
        .from("notes")
        .select("id, body, content_items(title, url)")
        .eq("user_id", user.id)
        .ilike("body", like)
        .limit(5),
      orSafe.length >= 2
        ? supabase
            .from("opportunity_tracker")
            .select("id, title, company, url, status")
            .eq("user_id", user.id)
            .or(
              `title.ilike.%${orSafe}%,company.ilike.%${orSafe}%,opportunity_type.ilike.%${orSafe}%,notes.ilike.%${orSafe}%`
            )
            .limit(5)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("weekly_reviews")
        .select("id, week_start, week_end, biggest_stories")
        .order("week_start", { ascending: false })
        .limit(10),
    ]);

    for (const row of saved.data ?? []) {
      const content = firstContent(row.content_items);
      if (!content) continue;
      results.push({
        id: `saved:${row.id}`,
        type: "saved",
        title: content.title,
        url: content.url,
        href: "/saved",
      });
    }

    for (const row of notes.data ?? []) {
      const content = firstContent(row.content_items);
      results.push({
        id: `note:${row.id}`,
        type: "note",
        title: content?.title ?? row.body.split("\n")[0].slice(0, 80),
        subtitle: row.body.slice(0, 120),
        href: "/notes",
      });
    }

    for (const row of opportunities.data ?? []) {
      results.push({
        id: `opp:${row.id}`,
        type: "opportunity",
        title: row.title,
        subtitle: [row.company, row.status].filter(Boolean).join(" · ") || null,
        url: row.url,
        href: "/placement",
      });
    }

    const q = query.toLowerCase();
    for (const row of reviews.data ?? []) {
      const stories = (row.biggest_stories ?? []) as Array<{ id: string; title: string }>;
      const match = stories.some((s) => s.title.toLowerCase().includes(q));
      if (match) {
        results.push({
          id: `review:${row.id}`,
          type: "review",
          title: `Weekly Review: ${row.week_start} — ${row.week_end}`,
          subtitle: stories[0]?.title ?? null,
          href: "/review",
          date: row.week_start,
        });
      }
    }
  }

  return NextResponse.json({ results });
}
