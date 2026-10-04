import { useEffect, useRef } from 'react';
import type { CartLine } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCartStore, lineKey } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { catalog } from '@/services/catalog';
import {
  addRemoteWishlist,
  fetchRemoteCart,
  fetchRemoteWishlist,
  pushRemoteCart,
  removeRemoteWishlist,
} from '@/services/remoteCommerce';
import { buildSnapshot } from '@/lib/product';
import { isSupabaseConfigured } from '@/lib/supabase';

const toRemote = (lines: CartLine[]) => lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity }));

/**
 * Keeps the guest (localStorage) cart and wishlist in sync with Supabase for
 * signed-in users:
 *   - on sign-in: merges local + remote, then pushes the merged result
 *   - while signed in: pushes changes (debounced)
 *   - on sign-out: clears the device copy so the next visitor starts fresh
 */
export function useCommerceSync() {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || loading) return;

    if (!userId) {
      if (prevUserId.current) {
        useCartStore.getState().clear();
        useWishlistStore.getState().clear();
      }
      prevUserId.current = null;
      return;
    }

    prevUserId.current = userId;
    let cancelled = false;
    let ready = false;
    let cartTimer: number | undefined;
    let syncedWishlist = new Set<string>();

    async function mergeOnSignIn(uid: string) {
      const [remoteLines, remoteWishlist] = await Promise.all([fetchRemoteCart(uid), fetchRemoteWishlist(uid)]);
      if (cancelled) return;

      // Cart: union, summing quantities for identical lines.
      const local = useCartStore.getState().lines;
      const merged = new Map<string, { productId: string; variantId: string | null; quantity: number }>();
      for (const l of [...remoteLines, ...toRemote(local)]) {
        const key = lineKey(l.productId, l.variantId);
        const prev = merged.get(key);
        merged.set(key, { ...l, quantity: (prev?.quantity ?? 0) + l.quantity });
      }
      const products = await catalog.getProductsByIds([...new Set([...merged.values()].map((l) => l.productId))]);
      if (cancelled) return;
      const byId = new Map(products.map((p) => [p.id, p]));
      const lines: CartLine[] = [];
      for (const l of merged.values()) {
        const product = byId.get(l.productId);
        if (!product) continue;
        const variant = l.variantId ? product.variants.find((v) => v.id === l.variantId) ?? null : null;
        if (l.variantId && !variant) continue;
        const snapshot = buildSnapshot(product, variant);
        if (snapshot.maxQuantity <= 0) continue;
        lines.push({ ...l, quantity: Math.min(l.quantity, snapshot.maxQuantity), snapshot });
      }
      useCartStore.getState().replaceLines(lines);
      await pushRemoteCart(uid, toRemote(lines));

      // Wishlist: union.
      const localIds = useWishlistStore.getState().ids;
      const union = [...new Set([...localIds, ...remoteWishlist])];
      await addRemoteWishlist(uid, union.filter((id) => !remoteWishlist.includes(id)));
      useWishlistStore.getState().replace(union);
      syncedWishlist = new Set(union);
      ready = true;
    }

    mergeOnSignIn(userId).catch((e) => console.error('Cart/wishlist sync failed', e));

    const unsubCart = useCartStore.subscribe((state, prev) => {
      if (!ready || state.lines === prev.lines) return;
      window.clearTimeout(cartTimer);
      cartTimer = window.setTimeout(() => {
        pushRemoteCart(userId, toRemote(useCartStore.getState().lines)).catch((e) => console.error('Cart sync failed', e));
      }, 600);
    });

    const unsubWishlist = useWishlistStore.subscribe((state) => {
      if (!ready) return;
      const current = new Set(state.ids);
      const added = state.ids.filter((id) => !syncedWishlist.has(id));
      const removed = [...syncedWishlist].filter((id) => !current.has(id));
      syncedWishlist = current;
      Promise.all([addRemoteWishlist(userId, added), removeRemoteWishlist(userId, removed)]).catch((e) =>
        console.error('Wishlist sync failed', e),
      );
    });

    return () => {
      cancelled = true;
      window.clearTimeout(cartTimer);
      unsubCart();
      unsubWishlist();
    };
  }, [userId, loading]);
}
