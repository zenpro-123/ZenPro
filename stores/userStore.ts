import { create } from "zustand";
import type { UserProfile, UserPreferences } from "@/types/user";

interface UserState {
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  setProfile: (profile: UserProfile | null) => void;
  /** Merge a partial update into the existing profile (no-op if not yet hydrated). */
  updateProfile: (partial: Partial<UserProfile>) => void;
  setPreferences: (preferences: UserPreferences | null) => void;
  /** Convenience: true once both profile and preferences have been hydrated. */
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
}

/** Hydrated once on app load from the server-fetched profile + preferences. */
export const useUserStore = create<UserState>((set) => ({
  profile: null,
  preferences: null,
  hydrated: false,
  setProfile: (profile) => set({ profile }),
  updateProfile: (partial) =>
    set((s) => (s.profile ? { profile: { ...s.profile, ...partial } } : {})),
  setPreferences: (preferences) => set({ preferences }),
  setHydrated: (value) => set({ hydrated: value }),
}));
