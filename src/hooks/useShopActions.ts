import { useCallback } from 'react';
import type { Product, ProductVariant } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useUiStore } from '@/store/uiStore';
import { toast } from '@/store/toastStore';
import { isSoldOut } from '@/lib/product';

/** Shared add-to-cart / wishlist behavior with consistent feedback. */
export function useShopActions() {
  const add = useCartStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const openCart = useUiStore((s) => s.openCart);

  const addToCart = useCallback(
    (product: Product, variant: ProductVariant | null, quantity = 1, opts: { openDrawer?: boolean } = {}) => {
      if (product.variants.length && !variant) {
        toast.info('Choose an edition', `Select an edition of ${product.name} before adding it to your cart.`);
        return false;
      }
      if (isSoldOut(product, variant)) {
        toast.error('Sold out', `${product.name} is currently unavailable.`);
        return false;
      }
      const added = add(product, variant, quantity);
      if (added === 0) {
        toast.info('Maximum quantity reached', 'You already have all available stock of this item in your cart.');
        return false;
      }
      if (opts.openDrawer !== false) openCart();
      toast.success(
        added < quantity ? `Added ${added} (stock limit reached)` : 'Added to cart',
        `${product.name}${variant ? ` — ${variant.name}` : ''}`,
      );
      return true;
    },
    [add, openCart],
  );

  const toggleWish = useCallback(
    (product: Product) => {
      const added = toggleWishlist(product.id);
      toast.success(added ? 'Saved to wishlist' : 'Removed from wishlist', product.name);
    },
    [toggleWishlist],
  );

  return { addToCart, toggleWish };
}
