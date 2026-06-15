"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, COMING_SOON_ITEMS } from "@/config/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarNavProps {
  onNavigate?: () => void;
}

/** Shared nav content used by the desktop sidebar and the mobile sheet. */
export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2 px-4 py-5 text-lg font-semibold tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        ZenPro
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="px-3 pb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
            Coming soon
          </p>
          {COMING_SOON_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <div className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground/40">
                    <Icon className="h-4 w-4" />
                    {item.label}
                    <Lock className="ml-auto h-3 w-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Planned for V2</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </nav>

      <div className="px-4 py-4 text-xs text-muted-foreground/60">
        ZenPro v1.0 — Your Daily Intelligence Companion
      </div>
    </div>
  );
}
