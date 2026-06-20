import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  busyMode: boolean;
  /**
   * Whether the busy/full swap should animate. Stays false for the initial seed
   * from the saved profile (so the dashboard doesn't appear to collapse on its
   * own during load) and flips true on the first user toggle.
   */
  busyModeAnimate: boolean;
  commandCenterOpen: boolean;
  aboutOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleBusyMode: () => void;
  setBusyMode: (value: boolean) => void;
  /** Seed busy mode from persisted state without triggering a swap animation. */
  seedBusyMode: (value: boolean) => void;
  setCommandCenterOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
}

/** Shell-level UI state: sidebar collapse, busy mode, command center modal. */
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  busyMode: false,
  busyModeAnimate: false,
  commandCenterOpen: false,
  aboutOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleBusyMode: () => set((s) => ({ busyMode: !s.busyMode, busyModeAnimate: true })),
  setBusyMode: (value) => set({ busyMode: value, busyModeAnimate: true }),
  seedBusyMode: (value) => set({ busyMode: value }),
  setCommandCenterOpen: (open) => set({ commandCenterOpen: open }),
  setAboutOpen: (open) => set({ aboutOpen: open }),
}));
