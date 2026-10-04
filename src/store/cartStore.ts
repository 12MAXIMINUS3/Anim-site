import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CartLine, Product, ProductVariant } from '@/types';
import { buildSnapshot, MAX_PER_LINE } from '@/lib/product';

export const lineKey = (productId: string, variantId: string | null) => `${productId}:${variantId ?? 'base'}`;

interface CartState {
  lines: CartLine[];
  promoCode: string | null;
  /** Adds a product; returns the quantity actually added (may be capped by stock). */
  add: (product: Product, variant: ProductVariant | null, quantity: number) => number;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setPromoCode: (code: string | null) => void;
  replaceLines: (lines: CartLine[]) => void;
  /** Refreshes price/stock snapshots from fresh product data and drops unavailable lines. */
  refreshFromProducts: (products: Product[]) => { removed: string[]; adjusted: string[] };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      promoCode: null,

      add(product, variant, quantity) {
        const snapshot = buildSnapshot(product, variant);
        const key = lineKey(product.id, variant?.id ?? null);
        const existing = get().lines.find((l) => lineKey(l.productId, l.variantId) === key);
        const current = existing?.quantity ?? 0;
        const target = Math.min(snapshot.maxQuantity, current + quantity);
        const added = Math.max(0, target - current);
        if (added === 0) return 0;
        set((s) => ({
          lines: existing
            ? s.lines.map((l) => (lineKey(l.productId, l.variantId) === key ? { ...l, quantity: target, snapshot } : l))
            : [...s.lines, { productId: product.id, variantId: variant?.id ?? null, quantity: target, snapshot }],
        }));
        return added;
      },

      setQuantity(key, quantity) {
        set((s) => ({
          lines: s.lines
            .map((l) =>
              lineKey(l.productId, l.variantId) === key
                ? { ...l, quantity: Math.max(0, Math.min(quantity, l.snapshot.maxQuantity, MAX_PER_LINE)) }
                : l,
            )
            .filter((l) => l.quantity > 0),
        }));
      },

      remove(key) {
        set((s) => ({ lines: s.lines.filter((l) => lineKey(l.productId, l.variantId) !== key) }));
      },

      clear() {
        set({ lines: [], promoCode: null });
      },

      setPromoCode(code) {
        set({ promoCode: code });
      },

      replaceLines(lines) {
        set({ lines });
      },

      refreshFromProducts(products) {
        const byId = new Map(products.map((p) => [p.id, p]));
        const removed: string[] = [];
        const adjusted: string[] = [];
        const next: CartLine[] = [];
        for (const line of get().lines) {
          const product = byId.get(line.productId);
          const variant = line.variantId ? product?.variants.find((v) => v.id === line.variantId) ?? null : null;
          if (!product || (line.variantId && !variant)) {
            removed.push(line.snapshot.name);
            continue;
          }
          const snapshot = buildSnapshot(product, variant);
          if (snapshot.maxQuantity <= 0) {
            removed.push(line.snapshot.name);
            continue;
          }
          const quantity = Math.min(line.quantity, snapshot.maxQuantity);
          if (quantity !== line.quantity || snapshot.unitPrice !== line.snapshot.unitPrice) adjusted.push(snapshot.name);
          next.push({ ...line, quantity, snapshot });
        }
        set({ lines: next });
        return { removed, adjusted };
      },
    }),
    { name: 'nfv-cart', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

export const selectCartCount = (s: CartState) => s.lines.reduce((sum, l) => sum + l.quantity, 0);
export const selectSubtotal = (s: CartState) =>
  Math.round(s.lines.reduce((sum, l) => sum + l.quantity * l.snapshot.unitPrice, 0) * 100) / 100;
