import { create } from "zustand";

interface ContentState {
  /** Item IDs the user has bookmarked — kept client-side for instant toggle UI. */
  savedItemIds: Set<string>;
  /** Item IDs the user has viewed this session — feeds Intelligence Score. */
  viewedItemIds: Set<string>;
  toggleSaved: (itemId: string) => void;
  isSaved: (itemId: string) => boolean;
  markViewed: (itemId: string) => void;
  setSavedItemIds: (ids: string[]) => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
  savedItemIds: new Set(),
  viewedItemIds: new Set(),
  toggleSaved: (itemId) =>
    set((state) => {
      const next = new Set(state.savedItemIds);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return { savedItemIds: next };
    }),
  isSaved: (itemId) => get().savedItemIds.has(itemId),
  markViewed: (itemId) =>
    set((state) => {
      if (state.viewedItemIds.has(itemId)) return state;
      const next = new Set(state.viewedItemIds);
      next.add(itemId);
      return { viewedItemIds: next };
    }),
  setSavedItemIds: (ids) => set({ savedItemIds: new Set(ids) }),
}));
