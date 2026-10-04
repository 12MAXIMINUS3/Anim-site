import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { catalog } from '@/services/catalog';
import { toast } from '@/store/toastStore';

/** Re-validates cart prices and stock against the live catalog once per mount. */
export function useCartRefresh() {
  const [refreshing, setRefreshing] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const ids = [...new Set(useCartStore.getState().lines.map((l) => l.productId))];
    if (!ids.length) {
      setRefreshing(false);
      return;
    }
    catalog
      .getProductsByIds(ids)
      .then((products) => {
        if (cancelled) return;
        const { removed, adjusted } = useCartStore.getState().refreshFromProducts(products);
        if (removed.length) toast.info('Cart updated', `No longer available: ${removed.join(', ')}`);
        else if (adjusted.length) toast.info('Cart updated', `Price or stock changed for: ${adjusted.join(', ')}`);
      })
      .catch(() => {
        /* keep cached snapshots if the catalog is unreachable */
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return refreshing;
}
