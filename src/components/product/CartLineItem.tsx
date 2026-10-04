import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import type { CartLine } from '@/types';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Price } from '@/components/ui/Price';
import { lineKey, useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/format';

export function CartLineItem({ line, compact, onNavigate }: { line: CartLine; compact?: boolean; onNavigate?: () => void }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const key = lineKey(line.productId, line.variantId);
  const s = line.snapshot;

  return (
    <li className="flex gap-4 py-4">
      <Link to={`/product/${s.slug}`} onClick={onNavigate} className="shrink-0" tabIndex={-1} aria-hidden="true">
        <ImageWithFallback src={s.image} alt="" className={compact ? 'h-24 w-20 rounded-xl object-cover' : 'h-32 w-28 rounded-xl object-cover'} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {s.brandName && <p className="text-[11px] font-semibold uppercase tracking-wider text-pulse-400">{s.brandName}</p>}
            <Link to={`/product/${s.slug}`} onClick={onNavigate} className="line-clamp-2 text-sm font-semibold text-white hover:text-nova-200">
              {s.name}
            </Link>
            {s.variantName && <p className="text-xs text-ink-400">{s.variantName}</p>}
            {s.isPreorder && <p className="text-xs text-indigo-300">Preorder — ships on release</p>}
          </div>
          <button type="button" onClick={() => remove(key)} className="text-ink-400 hover:text-rose-300" aria-label={`Remove ${s.name} from cart`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <Price amount={s.unitPrice} compareAt={s.compareAtPrice} currency={s.currency} size="sm" />
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <QuantitySelector
            size="sm"
            value={line.quantity}
            max={Math.max(1, s.maxQuantity)}
            onChange={(q) => setQuantity(key, q)}
            label={`Quantity for ${s.name}`}
          />
          <span className="text-sm font-semibold text-white">{formatCurrency(s.unitPrice * line.quantity, s.currency)}</span>
        </div>
      </div>
    </li>
  );
}
