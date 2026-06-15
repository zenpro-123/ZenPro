import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  busyMode: boolean;
  commandCenterOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleBusyMode: () => void;
  setBusyMode: (value: boolean) => void;
  setCommandCenterOpen: (open: boolean) => void;
}

/** Shell-level UI state: sidebar collapse, busy mode, command center modal. */
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  busyMode: false,
  commandCenterOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleBusyMode: () => set((s) => ({ busyMode: !s.busyMode })),
  setBusyMode: (value) => set({ busyMode: value }),
  setCommandCenterOpen: (open) => set({ commandCenterOpen: open }),
}));
