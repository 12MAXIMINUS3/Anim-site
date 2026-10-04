import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/types';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

/** Horizontally scrolling product carousel with snap points and arrow controls. */
export function ProductRail({ products, loading, label }: { products?: Product[]; loading?: boolean; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };
  return (
    <div className="relative flex flex-col">
      <div className="order-last mt-4 hidden justify-end gap-2 sm:flex">
        <button type="button" className="icon-btn border border-ink-700" onClick={() => scroll(-1)} aria-label={`Scroll ${label} left`}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" className="icon-btn border border-ink-700" onClick={() => scroll(1)} aria-label={`Scroll ${label} right`}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {(loading ? Array.from({ length: 5 }) : products ?? []).map((p, i) => (
          <div key={loading ? i : (p as Product).id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23.5%]">
            {loading ? <ProductCardSkeleton /> : <ProductCard product={p as Product} />}
          </div>
        ))}
      </div>
    </div>
  );
}
