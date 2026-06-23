"use client";

import { ZenProMark } from "@/components/shared/ZenProMark";
import { useUIStore } from "@/stores/uiStore";
import { APP_VERSION } from "@/config/app";

export function Footer() {
  const setAboutOpen = useUIStore((s) => s.setAboutOpen);

  return (
    <footer className="border-t border-foreground/[0.06] px-4 py-4 lg:px-8">
      <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground/50 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className="flex items-center gap-1.5 transition-colors hover:text-muted-foreground/80"
        >
          <ZenProMark className="h-3 w-3" />
          <span className="font-heading font-medium">ZenPro</span>
          <span>&copy; 2026</span>
        </button>

        <span>Designed &amp; Built by Soorya</span>

        <div className="flex items-center gap-3">
          <a
            href="mailto:skkumarsoorya@gmail.com"
            className="transition-colors hover:text-muted-foreground/80"
          >
            skkumarsoorya@gmail.com
          </a>
          <span className="rounded-full border border-foreground/[0.08] px-2 py-0.5 text-[10px]">
            v{APP_VERSION}
          </span>
        </div>
      </div>
    </footer>
  );
}
