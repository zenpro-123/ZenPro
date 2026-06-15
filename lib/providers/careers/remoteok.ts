import { BaseProvider, type ProviderConfig, type ProviderResult } from "@/lib/providers/base";
import { CAREER_SOURCES } from "@/config/sources";
import { contentHash } from "@/lib/utils/deduplication";
import { CACHE_TTL } from "@/lib/utils/cache";
import { formatCompactNumber, stripHtml, truncate } from "@/lib/utils/formatting";
import type { CareerOpportunity } from "@/types/content";

interface RemoteOKJob {
  id?: string;
  slug: string;
  date: string;
  company: string;
  company_logo?: string;
  logo?: string;
  position: string;
  tags?: string[];
  location?: string;
  url?: string;
  apply_url?: string;
  salary_min?: number;
  salary_max?: number;
  description?: string;
}

function formatSalary(min?: number, max?: number): string | undefined {
  if (!min && !max) return undefined;
  if (min && max && min !== max) return `$${formatCompactNumber(min)} – $${formatCompactNumber(max)}`;
  const value = max || min;
  return value ? `$${formatCompactNumber(value)}` : undefined;
}

/** Remote job leg of Career Radar (Module 10) via RemoteOK's free public API. */
export class RemoteOKProvider extends BaseProvider<CareerOpportunity> {
  readonly config: ProviderConfig = {
    id: "remoteok",
    name: "RemoteOK",
    description: "Remote jobs and internships",
    enabled: true,
    cacheTTLSeconds: CACHE_TTL.CAREERS,
  };

  async fetch(): Promise<ProviderResult<CareerOpportunity>> {
    try {
      const res = await fetch(CAREER_SOURCES.remoteok, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ZenProBot/1.0)" },
      });
      if (!res.ok) throw new Error(`RemoteOK API error (${res.status})`);

      const body = (await res.json()) as RemoteOKJob[];

      const items: CareerOpportunity[] = body
        .filter((job) => job.id)
        .map((job) => {
          const url = job.url ?? job.apply_url ?? `https://remoteok.com/remote-jobs/${job.slug}`;
          const hash = contentHash("remoteok", job.position, url);
          const tags = (job.tags ?? []).slice(0, 5);

          return {
            id: hash,
            source: "RemoteOK",
            category: "career",
            title: job.position,
            summary: job.description ? truncate(stripHtml(job.description), 220) : undefined,
            url,
            author: job.company,
            imageUrl: job.company_logo || job.logo || undefined,
            publishedAt: job.date,
            metadata: {
              type: "job",
              company: job.company,
              location: job.location,
              remote: true,
              salary: formatSalary(job.salary_min, job.salary_max),
              tags,
            },
            contentHash: hash,
            tags,
          };
        });

      return this.ok(items);
    } catch (err) {
      return this.fail(err);
    }
  }
}

export const remoteOkProvider = new RemoteOKProvider();
