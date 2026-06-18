"use client";

import { Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUIStore } from "@/stores/uiStore";
import { useUserStore } from "@/stores/userStore";
import { cn } from "@/lib/utils";

/** Module 15 — one-click toggle that collapses the dashboard to a 60-second summary. */
export function BusyModeToggle() {
  const busyMode = useUIStore((s) => s.busyMode);
  const setBusyMode = useUIStore((s) => s.setBusyMode);
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);

  function handleChange(next: boolean) {
    setBusyMode(next);

    // Persist per-user when signed in; anonymous users keep ephemeral UI state.
    if (profile) {
      updateProfile({ busyMode: next });
      void fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ busyMode: next }),
      }).catch(() => {
        /* best-effort; UI state already updated */
      });
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
        busyMode ? "border-warning/30 bg-warning/10" : "border-foreground/10 bg-foreground/[0.03]"
      )}
    >
      <Zap className={cn("h-3.5 w-3.5", busyMode ? "text-warning" : "text-muted-foreground")} />
      <Label htmlFor="busy-mode" className="cursor-pointer text-xs font-medium">
        Busy mode
      </Label>
      <Switch id="busy-mode" checked={busyMode} onCheckedChange={handleChange} />
    </div>
  );
}
