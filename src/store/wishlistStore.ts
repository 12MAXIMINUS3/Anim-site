import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface WishlistState {
  ids: string[];
  toggle: (productId: string) => boolean;
  remove: (productId: string) => void;
  replace: (ids: string[]) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle(productId) {
        const has = get().ids.includes(productId);
        set((s) => ({ ids: has ? s.ids.filter((id) => id !== productId) : [productId, ...s.ids] }));
        return !has;
      },
      remove(productId) {
        set((s) => ({ ids: s.ids.filter((id) => id !== productId) }));
      },
      replace(ids) {
        set({ ids: [...new Set(ids)] });
      },
      clear() {
        set({ ids: [] });
      },
    }),
    { name: 'nfv-wishlist', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
