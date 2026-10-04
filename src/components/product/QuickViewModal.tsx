import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { ProductVariant } from '@/types';
import { Dialog } from '@/components/ui/Dialog';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Price } from '@/components/ui/Price';
import { Rating } from '@/components/ui/Rating';
import { ProductBadgeTag } from '@/components/ui/Badge';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { VariantSelector } from './VariantSelector';
import { useUiStore } from '@/store/uiStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useShopActions } from '@/hooks/useShopActions';
import { availabilityLabel, displayBadge, isSoldOut, MAX_PER_LINE } from '@/lib/product';
import { cn } from '@/lib/cn';

export function QuickViewModal() {
  const product = useUiStore((s) => s.quickViewProduct);
  const close = useUiStore((s) => s.closeQuickView);
  const wished = useWishlistStore((s) => (product ? s.ids.includes(product.id) : false));
  const { addToCart, toggleWish } = useShopActions();
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setVariant(product?.variants.find((v) => v.inventoryQuantity > 0) ?? null);
    setQty(1);
    setImageIndex(0);
  }, [product]);

  if (!product) return null;
  const badge = displayBadge(product);
  const soldOut = isSoldOut(product, variant);
  const stock = variant ? variant.inventoryQuantity : product.inventoryQuantity;
  const avail = availabilityLabel(product, variant);
  const unit = variant?.price ?? product.price;
  const compare = variant?.price != null ? null : product.salePrice !== null ? product.regularPrice : null;
  const image = product.images[imageIndex] ?? product.images[0];

  return (
    <Dialog open onClose={close} title={`Quick view: ${product.name}`} hideTitle size="lg">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ink-850">
            <ImageWithFallback src={image?.url} alt={image?.alt ?? product.name} className="h-full w-full object-cover" />
            {badge && <ProductBadgeTag badge={badge} className="absolute left-3 top-3" />}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-pressed={i === imageIndex}
                  className={cn('h-16 w-14 overflow-hidden rounded-lg border', i === imageIndex ? 'border-nova-400' : 'border-ink-700')}
                >
                  <ImageWithFallback src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          {product.brand && <p className="eyebrow">{product.brand.name}</p>}
          <h3 className="text-2xl font-bold">{product.name}</h3>
          {product.ratingCount > 0 && <Rating value={product.ratingAvg} count={product.ratingCount} />}
          <Price amount={unit} compareAt={compare} currency={product.currency} size="lg" showPercent />
          <p className="text-sm text-ink-300">{product.shortDescription}</p>
          <p
            className={cn(
              'text-sm font-medium',
              avail.tone === 'ok' && 'text-emerald-300',
              avail.tone === 'low' && 'text-amber-300',
              avail.tone === 'out' && 'text-rose-300',
              avail.tone === 'pre' && 'text-indigo-300',
            )}
          >
            {avail.label}
          </p>
          <VariantSelector product={product} value={variant} onChange={setVariant} />
          <div className="flex flex-wrap items-center gap-3">
            <QuantitySelector value={qty} onChange={setQty} max={Math.max(1, Math.min(MAX_PER_LINE, stock))} disabled={soldOut} />
            <button
              type="button"
              disabled={soldOut}
              className="btn-primary flex-1"
              onClick={() => {
                if (addToCart(product, variant, qty)) close();
              }}
            >
              {soldOut ? 'Sold out' : product.badge === 'preorder' ? 'Preorder now' : 'Add to cart'}
            </button>
            <button
              type="button"
              onClick={() => toggleWish(product)}
              aria-pressed={wished}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              className={cn('icon-btn border border-ink-700', wished && 'text-rose-300')}
            >
              <Heart className={cn('h-5 w-5', wished && 'fill-current')} />
            </button>
          </div>
          <Link to={`/product/${product.slug}`} onClick={close} className="text-sm font-semibold text-nova-300 hover:text-pulse-300">
            View full details →
          </Link>
        </div>
      </div>
    </Dialog>
  );
}
