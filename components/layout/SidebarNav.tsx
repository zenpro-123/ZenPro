"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/config/navigation";
import { NavTooltip } from "@/components/layout/NavTooltip";

interface SidebarNavProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  const visibleGroups = NAV_GROUPS.filter((g) => g.items.length > 0);

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        className="flex items-center gap-2.5 px-4 py-5 font-heading text-lg font-semibold tracking-tight"
      >
        <span className="ring-gradient flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-sm shadow-primary/30">
          <Sparkles className="h-4 w-4" />
        </span>
        ZenPro
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 no-scrollbar">
        {visibleGroups.map((group, groupIndex) => {
          const isComingSoon = group.id === "coming-soon";

          return (
            <div key={group.id}>
              <div
                className={cn(
                  "flex items-center gap-2 px-3 pb-2",
                  groupIndex === 0 ? "pt-0" : isComingSoon ? "mt-2 border-t border-foreground/[0.06] pt-5" : "pt-5",
                )}
              >
                <span className="h-3 w-0.5 shrink-0 rounded-full bg-gradient-to-b from-primary to-chart-2" />
                <span className="eyebrow text-[10px] tracking-[0.2em] text-muted-foreground/50">
                  {group.label}
                </span>
              </div>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  if (item.comingSoon) {
                    const Icon = item.icon;
                    return (
                      <NavTooltip key={item.label} description={item.description}>
                        <div className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground/40">
                          <Icon className="h-4 w-4" />
                          {item.label}
                          <Lock className="ml-auto h-3 w-3" />
                        </div>
                      </NavTooltip>
                    );
                  }

                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <NavTooltip key={item.href} description={item.description}>
                      <Link
                        href={item.href!}
                        onClick={onNavigate}
                        className={cn(
                          "group/nav relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "ring-gradient bg-gradient-to-r from-primary/15 to-chart-2/10 text-foreground"
                            : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                        )}
                      >
                        <Icon
                          className={cn("h-4 w-4 shrink-0 transition-colors", isActive && "text-primary")}
                        />
                        {item.label}
                      </Link>
                    </NavTooltip>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-4 py-4 text-xs text-muted-foreground/60">
        ZenPro v1.0 — Your Daily Intelligence Companion
      </div>
    </div>
  );
}
