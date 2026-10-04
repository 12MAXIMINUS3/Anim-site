import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '@/types';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { ProductBadgeTag } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { Rating } from '@/components/ui/Rating';
import { useWishlistStore } from '@/store/wishlistStore';
import { useUiStore } from '@/store/uiStore';
import { useShopActions } from '@/hooks/useShopActions';
import { displayBadge, isSoldOut } from '@/lib/product';
import { cn } from '@/lib/cn';

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const wished = useWishlistStore((s) => s.ids.includes(product.id));
  const openQuickView = useUiStore((s) => s.openQuickView);
  const { addToCart, toggleWish } = useShopActions();
  const badge = displayBadge(product);
  const soldOut = isSoldOut(product);
  const [first, second] = product.images;
  const href = `/product/${product.slug}`;
  const needsChoice = product.variants.length > 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/70 transition hover:border-nova-500/50 hover:shadow-glow">
      <div className="relative aspect-[4/5] overflow-hidden bg-ink-850">
        <Link to={href} tabIndex={-1} aria-hidden="true">
          <ImageWithFallback
            src={first?.url}
            alt=""
            className={cn(
              'h-full w-full object-cover transition duration-500 group-hover:scale-105',
              second && 'group-hover:opacity-0',
            )}
          />
          {second && (
            <ImageWithFallback
              src={second.url}
              alt=""
              className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition duration-500 group-hover:scale-100 group-hover:opacity-100"
            />
          )}
        </Link>

        {badge && <ProductBadgeTag badge={badge} className="absolute left-3 top-3" />}

        <button
          type="button"
          onClick={() => toggleWish(product)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className={cn(
            'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition',
            wished ? 'border-rose-400/60 bg-rose-500/20 text-rose-300' : 'border-white/10 bg-ink-950/60 text-white hover:text-rose-300',
          )}
        >
          <Heart className={cn('h-4 w-4', wished && 'fill-current')} />
        </button>

        <div className="absolute inset-x-3 bottom-3 flex gap-2 transition duration-300 md:translate-y-3 md:opacity-0 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <button
            type="button"
            onClick={() => (needsChoice ? openQuickView(product) : addToCart(product, null, 1))}
            disabled={soldOut}
            className="btn-primary flex-1 px-3 py-2 text-xs"
            aria-label={soldOut ? `${product.name} is sold out` : needsChoice ? `Choose options for ${product.name}` : `Add ${product.name} to cart`}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            {soldOut ? 'Sold out' : needsChoice ? 'Choose' : product.badge === 'preorder' ? 'Preorder' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => openQuickView(product)}
            className="btn-secondary px-3 py-2 text-xs"
            aria-label={`Quick view ${product.name}`}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Quick view</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.brand && <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pulse-400">{product.brand.name}</p>}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
          <Link to={href} className="hover:text-nova-200">
            {product.name}
          </Link>
        </h3>
        {product.ratingCount > 0 && <Rating value={product.ratingAvg} count={product.ratingCount} />}
        <Price
          amount={product.price}
          compareAt={product.salePrice !== null ? product.regularPrice : null}
          currency={product.currency}
          className="mt-auto pt-1"
        />
      </div>
    </article>
  );
});

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/70" aria-hidden="true">
      <div className="relative aspect-[4/5] overflow-hidden bg-ink-850">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 rounded bg-ink-800" />
        <div className="h-4 w-4/5 rounded bg-ink-800" />
        <div className="h-4 w-1/4 rounded bg-ink-800" />
      </div>
    </div>
  );
}
