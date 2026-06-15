"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { BusyModeToggle } from "@/components/layout/BusyModeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { useUIStore } from "@/stores/uiStore";

/** Sticky dashboard header: mobile nav trigger, command center search, busy mode, user menu. */
export function Header() {
  const setCommandCenterOpen = useUIStore((s) => s.setCommandCenterOpen);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/5 bg-background/80 px-4 backdrop-blur-xl lg:px-6">
      <MobileSidebar />

      <button
        onClick={() => setCommandCenterOpen(true)}
        className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-white/20 hover:bg-white/[0.06] sm:max-w-sm"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search ZenPro...</span>
        <kbd className="hidden rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <span
          className="hidden text-xs text-muted-foreground md:inline"
          suppressHydrationWarning
        >
          {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </span>
        <BusyModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
