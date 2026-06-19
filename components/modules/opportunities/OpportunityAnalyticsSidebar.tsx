import { Link as LinkIcon, BarChart3, TrendingUp } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/shared/GlassCard";
import { TrendBadge } from "@/components/shared/TrendBadge";
import { Button } from "@/components/ui/button";
import type { OpportunityAnalytics } from "@/types/opportunity-intel";

interface OpportunityAnalyticsSidebarProps {
  analytics: OpportunityAnalytics;
}

/** Sticky analytics rail for the Opportunity Map — categories + growing skills. */
export function OpportunityAnalyticsSidebar({ analytics }: OpportunityAnalyticsSidebarProps) {
  const maxCategory = Math.max(...analytics.byCategory.map((c) => c.count), 1);

  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <GlassCard className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Most Active Categories
          </h3>
        </div>
        {analytics.byCategory.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data yet.</p>
        ) : (
          <div className="space-y-2.5">
            {analytics.byCategory.slice(0, 6).map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize text-foreground">{cat.category}</span>
                  <span className="tabular-nums text-muted-foreground">{cat.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-chart-2"
                    style={{ width: `${(cat.count / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Fastest Growing Skills
          </h3>
        </div>
        {analytics.topSkills.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data yet.</p>
        ) : (
          <div className="space-y-2">
            {analytics.topSkills.map((skill) => (
              <div key={skill.skill} className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-foreground">{skill.skill}</span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-xs tabular-nums text-muted-foreground">{skill.count}</span>
                  <TrendBadge direction={skill.trend} showIcon={false} />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-primary" />
          <h3 className="font-heading text-sm font-semibold tracking-tight">Track Applications</h3>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Tracked opportunities flow into your Placement board where you can move them through your
          pipeline.
        </p>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/placement">Open Placement</Link>
        </Button>
      </GlassCard>
    </div>
  );
}
