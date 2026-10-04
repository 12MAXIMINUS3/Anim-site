import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { catalog } from '@/services/catalog';
import { useAsync } from '@/hooks/useAsync';
import { useSeo } from '@/lib/seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductGrid } from '@/components/product/ProductGrid';
import { EmptyState, ErrorState } from '@/components/ui/States';

/** Wishlist grid — reused inside the account dashboard. */
export function WishlistGrid() {
  const ids = useWishlistStore((s) => s.ids);
  const clear = useWishlistStore((s) => s.clear);
  const { data, loading, error, reload } = useAsync(() => catalog.getProductsByIds(ids), [ids.join(',')]);

  if (!ids.length) {
    return (
      <EmptyState
        icon={<Heart className="h-7 w-7" aria-hidden="true" />}
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it here for later."
        action={
          <Link to="/shop" className="btn-primary">
            Discover collectibles
          </Link>
        }
      />
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-ink-300">
          {ids.length} saved item{ids.length === 1 ? '' : 's'}
        </p>
        <button type="button" onClick={clear} className="text-sm font-semibold text-ink-400 hover:text-rose-300">
          Clear wishlist
        </button>
      </div>
      <ProductGrid products={data} loading={loading} skeletonCount={Math.min(ids.length, 8)} />
      {!loading && data && data.length < ids.length && (
        <p className="mt-4 text-xs text-ink-400">Some saved items are no longer available and are hidden.</p>
      )}
    </div>
  );
}

export default function WishlistPage() {
  useSeo({ title: 'Wishlist', noIndex: true });
  return (
    <>
      <PageHeader title="Wishlist" crumbs={[{ label: 'Wishlist' }]} description="Pieces you’re keeping an eye on. Sign in to sync your wishlist across devices." />
      <div className="container-page py-10">
        <WishlistGrid />
      </div>
    </>
  );
}
