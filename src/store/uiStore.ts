import { create } from 'zustand';
import type { Product } from '@/types';

interface UiState {
  cartOpen: boolean;
  mobileNavOpen: boolean;
  quickViewProduct: Product | null;
  openCart: () => void;
  closeCart: () => void;
  setMobileNav: (open: boolean) => void;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  cartOpen: false,
  mobileNavOpen: false,
  quickViewProduct: null,
  openCart: () => set({ cartOpen: true, quickViewProduct: null }),
  closeCart: () => set({ cartOpen: false }),
  setMobileNav: (open) => set({ mobileNavOpen: open }),
  openQuickView: (product) => set({ quickViewProduct: product }),
  closeQuickView: () => set({ quickViewProduct: null }),
}));
