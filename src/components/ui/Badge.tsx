import type { ProductBadge } from '@/types';
import { BADGE_LABELS } from '@/lib/product';
import { cn } from '@/lib/cn';

const styles: Record<ProductBadge, string> = {
  new: 'bg-pulse-400 text-ink-950',
  sale: 'bg-rose-500 text-white',
  preorder: 'bg-indigo-500 text-white',
  limited: 'bg-gradient-to-r from-amber-300 to-orange-400 text-ink-950',
  sold_out: 'bg-ink-700 text-ink-200',
};

export function ProductBadgeTag({ badge, className }: { badge: ProductBadge; className?: string }) {
  return (
    <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider', styles[badge], className)}>
      {BADGE_LABELS[badge]}
    </span>
  );
}
