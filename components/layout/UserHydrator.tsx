"use client";

import { useEffect } from "react";
import { useUserStore } from "@/stores/userStore";
import { useUIStore } from "@/stores/uiStore";
import type { UserProfile, UserPreferences } from "@/types/user";

interface UserHydratorProps {
  profile: UserProfile | null;
  preferences: UserPreferences | null;
}

/** Hydrates the Zustand user store from server-fetched profile/preferences on mount. */
export function UserHydrator({ profile, preferences }: UserHydratorProps) {
  const setProfile = useUserStore((s) => s.setProfile);
  const setPreferences = useUserStore((s) => s.setPreferences);
  const setHydrated = useUserStore((s) => s.setHydrated);

  useEffect(() => {
    setProfile(profile);
    setPreferences(preferences);
    setHydrated(true);
    // Seed shell UI state from the saved profile so the Busy mode toggle reflects
    // the user's persisted choice on load.
    useUIStore.getState().seedBusyMode(profile?.busyMode ?? false);
  }, [profile, preferences, setProfile, setPreferences, setHydrated]);

  return null;
}
