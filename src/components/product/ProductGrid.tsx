import type { Product } from '@/types';
import { ProductCard, ProductCardSkeleton } from './ProductCard';
import { cn } from '@/lib/cn';

export type GridColumns = 2 | 3 | 4;

const colClass: Record<GridColumns, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-3 xl:grid-cols-4',
};

interface Props {
  products?: Product[];
  loading?: boolean;
  columns?: GridColumns;
  skeletonCount?: number;
}

export function ProductGrid({ products, loading, columns = 4, skeletonCount = 8 }: Props) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3', colClass[columns])} aria-busy={loading || undefined}>
      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => <ProductCardSkeleton key={i} />)
        : products?.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
