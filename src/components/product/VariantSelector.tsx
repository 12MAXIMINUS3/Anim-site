import type { Product, ProductVariant } from '@/types';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Props {
  product: Product;
  value: ProductVariant | null;
  onChange: (variant: ProductVariant) => void;
}

export function VariantSelector({ product, value, onChange }: Props) {
  if (!product.variants.length) return null;
  return (
    <fieldset>
      <legend className="label">Edition</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {product.variants.map((v) => {
          const soldOut = v.inventoryQuantity <= 0;
          const selected = value?.id === v.id;
          return (
            <label
              key={v.id}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition focus-within:ring-2 focus-within:ring-pulse-400',
                selected ? 'border-nova-400 bg-nova-500/10' : 'border-ink-700 hover:border-ink-500',
                soldOut && 'cursor-not-allowed opacity-50',
              )}
            >
              <input
                type="radio"
                name={`variant-${product.id}`}
                className="sr-only"
                checked={selected}
                disabled={soldOut}
                onChange={() => onChange(v)}
              />
              <span className="font-medium text-white">{v.name}</span>
              <span className="text-xs text-ink-300">
                {soldOut ? 'Sold out' : formatCurrency(v.price ?? product.price, product.currency)}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
