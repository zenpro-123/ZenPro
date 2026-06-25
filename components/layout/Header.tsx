"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { BusyModeToggle } from "@/components/layout/BusyModeToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

/** Pixels from the top within which the header always stays visible. */
const TOP_THRESHOLD = 80;
/** Min scroll delta before reacting, to ignore tiny jitter / rubber-banding. */
const SCROLL_DELTA = 6;

/** Sticky dashboard header that hides on scroll-down and reveals at the top /
 *  on scroll-up: mobile nav trigger, command center search, busy mode, user menu. */
export function Header() {
  const setCommandCenterOpen = useUIStore((s) => s.setCommandCenterOpen);
  const pathname = usePathname();
  const [now, setNow] = useState<Date>(() => new Date());
  const [hidden, setHidden] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // The header lives in the persistent dashboard layout, so it does not remount
  // on client navigation. Reveal it on every route change (the router resets
  // scroll to top) — otherwise it could stay stuck hidden on the next page.
  // Adjust-state-during-render pattern (avoids setState-in-effect).
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setHidden(false);
  }

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Hide when scrolling down past the top band; reveal near the top or on scroll-up.
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < TOP_THRESHOLD) setHidden(false);
        else if (y > lastY + SCROLL_DELTA) setHidden(true);
        else if (y < lastY - SCROLL_DELTA) setHidden(false);
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-foreground/[0.06] bg-background/70 px-4 backdrop-blur-2xl transition-transform duration-300 ease-out motion-reduce:transition-none lg:px-6",
        hidden && "-translate-y-full"
      )}
    >
      <MobileSidebar />

      {/* Compact search — opens the Command Center (the primary search surface).
          Icon-only on mobile; icon + ⌘K hint on desktop. */}
      <button
        onClick={() => setCommandCenterOpen(true)}
        aria-label="Search ZenPro"
        title="Search ZenPro (⌘K)"
        className="group flex items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.03] p-2 text-muted-foreground transition-all hover:border-primary/25 hover:bg-foreground/[0.06] hover:text-foreground sm:px-3"
      >
        <Search className="h-4 w-4 transition-colors group-hover:text-primary" />
        <kbd className="hidden rounded-md border border-foreground/10 bg-foreground/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
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
        <ThemeToggle />
        <BusyModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
