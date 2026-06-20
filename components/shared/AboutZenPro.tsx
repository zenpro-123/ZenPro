"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/stores/uiStore";
import { ZenProMark } from "@/components/shared/ZenProMark";

export function AboutZenPro() {
  const open = useUIStore((s) => s.aboutOpen);
  const setOpen = useUIStore((s) => s.setAboutOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass-strong ring-gradient surface-premium sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-sm shadow-primary/30">
              <ZenProMark className="h-4 w-4" />
            </span>
            ZenPro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            ZenPro is a personal intelligence dashboard designed to help
            ambitious learners, builders, and professionals stay informed
            without information overload.
          </p>
          <p>
            It combines technology intelligence, learning resources, career
            opportunities, tools, and industry signals into a single focused
            experience.
          </p>
        </div>

        <div className="mt-2 border-t border-foreground/[0.06] pt-3 text-xs text-muted-foreground/50">
          <p>Designed and Built by Soorya</p>
          <a
            href="mailto:skkumarsoorya@gmail.com"
            className="mt-1 block transition-colors hover:text-muted-foreground/80"
          >
            skkumarsoorya@gmail.com
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
