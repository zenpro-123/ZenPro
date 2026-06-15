import { BaseProvider, type ProviderConfig, type ProviderResult } from "@/lib/providers/base";
import { GITHUB_TRENDING_CONFIG } from "@/config/sources";
import { contentHash } from "@/lib/utils/deduplication";
import { CACHE_TTL } from "@/lib/utils/cache";
import type { GitHubRepo } from "@/types/content";

interface GitHubSearchItem {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  created_at: string;
  topics?: string[];
  owner: { login: string; avatar_url: string };
}

interface GitHubSearchResponse {
  items?: GitHubSearchItem[];
  message?: string;
}

/**
 * Module 12 — recently created repos gaining stars fast, via the GitHub
 * Search API (`created:>X stars:>=Y`, sorted by stars). "starsToday" is a
 * derived velocity metric (total stars / days since creation) — GitHub's
 * official trending feed isn't a public API.
 */
export class GitHubTrendingProvider extends BaseProvider<GitHubRepo> {
  readonly config: ProviderConfig = {
    id: "github-trending",
    name: "GitHub Trending",
    description: "Recently created repos gaining stars fast",
    enabled: true,
    cacheTTLSeconds: CACHE_TTL.GITHUB_TRENDING,
    requiresAuth: false,
  };

  async fetch(): Promise<ProviderResult<GitHubRepo>> {
    try {
      const since = new Date(Date.now() - GITHUB_TRENDING_CONFIG.windowDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const query = `created:>${since} stars:>=${GITHUB_TRENDING_CONFIG.minStars}`;
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${GITHUB_TRENDING_CONFIG.perPage}`;

      const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      };
      if (process.env.GITHUB_ACCESS_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`;
      }

      const res = await fetch(url, { headers });
      const body = (await res.json()) as GitHubSearchResponse;

      if (!res.ok) {
        throw new Error(body.message ?? `GitHub API error (${res.status})`);
      }

      const now = Date.now();

      const items: GitHubRepo[] = (body.items ?? []).map((repo) => {
        const hash = contentHash("github", repo.full_name, repo.html_url);
        const daysSinceCreated = Math.max(
          1,
          Math.round((now - new Date(repo.created_at).getTime()) / (24 * 60 * 60 * 1000))
        );

        return {
          id: hash,
          source: "GitHub",
          category: "github",
          title: repo.full_name,
          summary: repo.description ?? undefined,
          url: repo.html_url,
          author: repo.owner.login,
          imageUrl: repo.owner.avatar_url,
          publishedAt: repo.created_at,
          metadata: {
            fullName: repo.full_name,
            stars: repo.stargazers_count,
            starsToday: Math.round(repo.stargazers_count / daysSinceCreated),
            language: repo.language,
            forks: repo.forks_count,
            ownerAvatar: repo.owner.avatar_url,
          },
          contentHash: hash,
          tags: (repo.topics ?? []).slice(0, 5),
        };
      });

      return this.ok(items);
    } catch (err) {
      return this.fail(err);
    }
  }
}

export const githubTrendingProvider = new GitHubTrendingProvider();
