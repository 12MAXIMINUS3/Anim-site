import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarClock, Heart, ShieldCheck, Truck, Zap } from 'lucide-react';
import type { ProductVariant } from '@/types';
import { catalog } from '@/services/catalog';
import { useAsync } from '@/hooks/useAsync';
import { useShopActions } from '@/hooks/useShopActions';
import { useSeo } from '@/lib/seo';
import { useSettings } from '@/context/SettingsContext';
import { useWishlistStore } from '@/store/wishlistStore';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';
import { availabilityLabel, careInstructions, displayBadge, isSoldOut, MAX_PER_LINE } from '@/lib/product';
import { formatCurrency, formatDate, formatReleaseMonth } from '@/lib/format';
import { FREE_SHIPPING_THRESHOLD, INSTALLMENT_COUNT, nextInstallmentAmount } from '@/lib/pricing';
import { ProductGallery } from '@/components/product/ProductGallery';
import { VariantSelector } from '@/components/product/VariantSelector';
import { ReviewsSection } from '@/components/product/ReviewsSection';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Breadcrumbs } from '@/components/layout/PageHeader';
import { Price } from '@/components/ui/Price';
import { Rating } from '@/components/ui/Rating';
import { ProductBadgeTag } from '@/components/ui/Badge';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Accordion } from '@/components/ui/Accordion';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import NotFoundPage from './NotFoundPage';

function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d;
}

export default function ProductPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { data: product, loading, error, reload } = useAsync(() => catalog.getProductBySlug(slug), [slug]);
  const related = useAsync(() => (product ? catalog.getRelatedProducts(product, 4) : Promise.resolve([])), [product?.id]);
  const recentIds = useRecentlyViewedStore((s) => s.ids);
  const pushRecent = useRecentlyViewedStore((s) => s.push);
  const recentToLoad = useMemo(() => recentIds.filter((id) => id !== product?.id).slice(0, 4), [recentIds, product?.id]);
  const recent = useAsync(() => catalog.getProductsByIds(recentToLoad), [recentToLoad.join(',')]);
  const wished = useWishlistStore((s) => (product ? s.ids.includes(product.id) : false));
  const { addToCart, toggleWish } = useShopActions();
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!product) return;
    setVariant(product.variants.find((v) => v.inventoryQuantity > 0) ?? null);
    setQty(1);
    // Record the view after rendering so "recently viewed" excludes the current page on first paint.
    const t = window.setTimeout(() => pushRecent(product.id), 500);
    return () => window.clearTimeout(t);
  }, [product, pushRecent]);

  const unitPrice = variant?.price ?? product?.price ?? 0;
  const compareAt = product && variant?.price == null && product.salePrice !== null ? product.regularPrice : null;
  const firstImage = product?.images[0]?.url;

  useSeo({
    title: product?.seoTitle?.replace(/ \| (Figure Haven|Nova Figure Vault)$/, '') ?? product?.name ?? 'Product',
    description: product?.seoDescription ?? product?.shortDescription,
    image: firstImage,
    jsonLd: product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          sku: product.sku,
          description: product.shortDescription,
          image: product.images.map((i) => new URL(i.url, window.location.origin).href),
          brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
          category: product.category?.name,
          releaseDate: product.releaseDate ?? undefined,
          aggregateRating:
            product.ratingCount > 0
              ? { '@type': 'AggregateRating', ratingValue: product.ratingAvg, reviewCount: product.ratingCount }
              : undefined,
          offers: {
            '@type': 'Offer',
            url: window.location.href,
            priceCurrency: product.currency,
            price: product.price.toFixed(2),
            availability:
              product.inventoryQuantity <= 0
                ? 'https://schema.org/SoldOut'
                : product.badge === 'preorder'
                  ? 'https://schema.org/PreOrder'
                  : 'https://schema.org/InStock',
          },
        }
      : null,
  });

  if (loading) {
    return (
      <div className="container-page grid gap-10 py-10 lg:grid-cols-2">
        <Skeleton className="aspect-[4/5] rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }
  if (error) return <div className="container-page py-16"><ErrorState title="This product could not be loaded" error={error} onRetry={reload} /></div>;
  if (!product) return <NotFoundPage message="That product doesn’t exist or is no longer available." />;

  const badge = displayBadge(product);
  const soldOut = isSoldOut(product, variant);
  const stock = variant ? variant.inventoryQuantity : product.inventoryQuantity;
  const avail = availabilityLabel(product, variant);
  const preorder = product.badge === 'preorder';
  const today = new Date();
  const eta = `${formatDate(addBusinessDays(today, 5))} – ${formatDate(addBusinessDays(today, 8))}`;

  const specs: Array<[string, string | null | undefined]> = [
    ['Brand', product.brand?.name],
    ['Series / franchise', product.franchise],
    ['Category', product.category?.name],
    ['Scale', product.scale],
    ['Material', product.material],
    ['Dimensions', product.dimensions],
    ['Weight', product.weight],
    ['Release date', product.releaseDate ? formatReleaseMonth(product.releaseDate) : null],
    ['SKU', variant?.sku ?? product.sku],
  ];

  const buy = (goToCheckout: boolean) => {
    const ok = addToCart(product, variant, qty, { openDrawer: !goToCheckout });
    if (ok && goToCheckout) navigate('/checkout');
  };

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: 'Shop', to: '/shop' },
          ...(product.category ? [{ label: product.category.name, to: `/category/${product.category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery key={product.id} images={product.images} name={product.name} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            {badge && <ProductBadgeTag badge={badge} />}
            {product.brand && <span className="eyebrow">{product.brand.name}</span>}
          </div>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{product.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-400">
            {product.ratingCount > 0 && (
              <a href="#reviews" className="flex items-center gap-2 hover:text-white">
                <Rating value={product.ratingAvg} count={product.ratingCount} />
              </a>
            )}
            {product.category && (
              <Link to={`/category/${product.category.slug}`} className="hover:text-white">
                {product.category.name}
              </Link>
            )}
            <span>SKU: {variant?.sku ?? product.sku}</span>
          </div>

          <Price amount={unitPrice} compareAt={compareAt} currency={product.currency} size="lg" showPercent />
          <p className="-mt-2 text-sm text-ink-300">
            or {INSTALLMENT_COUNT} payments of{' '}
            <strong className="text-white">{formatCurrency(nextInstallmentAmount(unitPrice, 0), product.currency)}</strong> — pay in installments or complete
            payment at checkout
          </p>

          <p className="text-ink-300">{product.shortDescription}</p>

          <p
            className={cn(
              'flex items-center gap-2 text-sm font-semibold',
              avail.tone === 'ok' && 'text-emerald-300',
              avail.tone === 'low' && 'text-amber-300',
              avail.tone === 'out' && 'text-rose-300',
              avail.tone === 'pre' && 'text-indigo-300',
            )}
          >
            <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
            {avail.label}
            {preorder && product.releaseDate && <span className="font-normal text-ink-300">· Expected {formatReleaseMonth(product.releaseDate)}</span>}
          </p>

          <VariantSelector product={product} value={variant} onChange={setVariant} />

          <div className="flex flex-wrap items-center gap-3">
            <QuantitySelector value={qty} onChange={setQty} max={Math.max(1, Math.min(MAX_PER_LINE, stock))} disabled={soldOut} />
            <button type="button" className="btn-primary flex-1 py-3" disabled={soldOut} onClick={() => buy(false)}>
              {soldOut ? 'Sold out' : preorder ? 'Preorder — add to cart' : 'Add to cart'}
            </button>
            <button
              type="button"
              onClick={() => toggleWish(product)}
              aria-pressed={wished}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              className={cn('icon-btn h-12 w-12 border border-ink-700', wished && 'border-rose-400/50 text-rose-300')}
            >
              <Heart className={cn('h-5 w-5', wished && 'fill-current')} />
            </button>
          </div>
          <button type="button" className="btn-cyan py-3" disabled={soldOut} onClick={() => buy(true)}>
            <Zap className="h-4 w-4" aria-hidden="true" /> Buy now
          </button>

          <div className="card space-y-3 p-5 text-sm">
            <p className="flex items-start gap-3">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-pulse-400" aria-hidden="true" />
              <span>
                {preorder ? (
                  <>Ships when the release arrives at our warehouse{product.releaseDate ? ` (expected ${formatReleaseMonth(product.releaseDate)})` : ''}.</>
                ) : (
                  <>
                    Order today, estimated delivery <strong className="text-white">{eta}</strong> with standard shipping.
                  </>
                )}
              </span>
            </p>
            <p className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-pulse-400" aria-hidden="true" />
              <span>Free standard shipping on orders over ${FREE_SHIPPING_THRESHOLD}. {settings.shippingMessage}</span>
            </p>
            {preorder && (
              <p className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-indigo-300" aria-hidden="true" />
                <span>Preorders can be cancelled any time before they ship.</span>
              </p>
            )}
          </div>

          <Accordion
            defaultOpen="description"
            items={[
              {
                id: 'description',
                title: 'Description',
                content: <p className="whitespace-pre-line">{product.fullDescription}</p>,
              },
              {
                id: 'specs',
                title: 'Specifications',
                content: (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                    {specs
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt className="text-ink-400">{k}</dt>
                          <dd className="text-ink-100">{v}</dd>
                        </div>
                      ))}
                  </dl>
                ),
              },
              {
                id: 'shipping',
                title: 'Shipping & returns',
                content: (
                  <div className="space-y-2">
                    <p>{settings.shippingMessage}</p>
                    <p>Unopened items may be returned within 30 days of delivery. Damaged-in-transit items are replaced free of charge.</p>
                    <Link to="/shipping&returns" className="font-semibold text-nova-300 hover:text-pulse-300">
                      Read the full shipping & returns policy →
                    </Link>
                  </div>
                ),
              },
              {
                id: 'care',
                title: 'Care instructions',
                content: (
                  <ul className="list-disc space-y-1.5 pl-5">
                    {careInstructions(product.category?.slug).map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                ),
              },
            ]}
          />
        </div>
      </div>

      <div className="mt-20 space-y-20">
        <ReviewsSection product={product} />

        {(related.loading || (related.data && related.data.length > 0)) && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="mb-6 text-2xl font-bold">
              You may also like
            </h2>
            <ProductGrid products={related.data} loading={related.loading} skeletonCount={4} />
          </section>
        )}

        {recentToLoad.length > 0 && recent.data && recent.data.length > 0 && (
          <section aria-labelledby="recent-heading">
            <h2 id="recent-heading" className="mb-6 text-2xl font-bold">
              Recently viewed
            </h2>
            <ProductGrid products={recent.data} />
          </section>
        )}
      </div>
    </div>
  );
}
