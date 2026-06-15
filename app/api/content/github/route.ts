import { NextRequest, NextResponse } from "next/server";
import { githubTrendingProvider } from "@/lib/providers/github";
import { summarizeArticles } from "@/lib/ai/summarizer";
import { getCached, setCached, CACHE_TTL } from "@/lib/utils/cache";
import type { GitHubRepo } from "@/types/content";

const CACHE_KEY = "content:github";

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "true";

  let repos = refresh ? null : await getCached<GitHubRepo[]>(CACHE_KEY);
  let cached = !!repos;
  let error: string | undefined;

  if (!repos) {
    const result = await githubTrendingProvider.fetch();
    error = result.error;
    repos = result.data.length > 0 ? await summarizeArticles(result.data) : [];
    if (repos.length > 0) {
      await setCached(CACHE_KEY, repos, CACHE_TTL.GITHUB_TRENDING);
    }
    cached = false;
  }

  return NextResponse.json({ data: repos, cached, error });
}
