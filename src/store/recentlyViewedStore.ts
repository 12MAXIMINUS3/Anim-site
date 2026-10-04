import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const MAX_RECENT = 12;

interface RecentlyViewedState {
  ids: string[];
  push: (productId: string) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      ids: [],
      push(productId) {
        set((s) => ({ ids: [productId, ...s.ids.filter((id) => id !== productId)].slice(0, MAX_RECENT) }));
      },
    }),
    { name: 'nfv-recently-viewed', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
