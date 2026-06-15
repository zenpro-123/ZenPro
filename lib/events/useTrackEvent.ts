"use client";

import { useCallback } from "react";
import { useUserStore } from "@/stores/userStore";
import type { TrackEventPayload } from "@/types/events";

/**
 * Fire-and-forget analytics tracking. No-ops for signed-out users (avoids a
 * guaranteed 401) and swallows all errors — tracking must never affect the UI.
 */
export function useTrackEvent(): (payload: TrackEventPayload) => void {
  const profile = useUserStore((s) => s.profile);

  return useCallback(
    (payload: TrackEventPayload) => {
      if (!profile) return;

      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Tracking is best-effort.
      });
    },
    [profile]
  );
}
