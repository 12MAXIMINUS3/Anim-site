import { useState, type ReactNode } from 'react';
import { Tag, X } from 'lucide-react';
import type { Totals } from '@/lib/pricing';
import { PROMO_CODES } from '@/lib/pricing';
import { formatCurrency } from '@/lib/format';
import { useCartStore } from '@/store/cartStore';

interface Props {
  totals: Totals;
  currency: string;
  shippingLabel?: string;
  children?: ReactNode;
}

/** Totals breakdown with promo-code entry, shared by the cart and checkout pages. */
export function OrderSummary({ totals, currency, shippingLabel, children }: Props) {
  const promoCode = useCartStore((s) => s.promoCode);
  const setPromoCode = useCartStore((s) => s.setPromoCode);
  const [input, setInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const fmt = (n: number) => formatCurrency(n, currency);

  const apply = () => {
    const code = input.trim().toUpperCase();
    if (!code) return;
    if (!PROMO_CODES[code]) {
      setLocalError(`“${code}” is not a valid promo code.`);
      return;
    }
    setLocalError(null);
    setPromoCode(code);
    setInput('');
  };

  return (
    <div className="card space-y-4 p-5">
      <h2 className="text-lg font-semibold">Order summary</h2>

      <div>
        <label htmlFor="promo" className="label">
          Promo code
        </label>
        {promoCode ? (
          <div className="flex items-center justify-between rounded-xl border border-nova-500/40 bg-nova-500/10 px-3 py-2 text-sm">
            <span className="flex items-center gap-2 font-semibold text-nova-200">
              <Tag className="h-4 w-4" aria-hidden="true" /> {promoCode}
            </span>
            <button type="button" onClick={() => setPromoCode(null)} className="text-ink-300 hover:text-white" aria-label={`Remove promo code ${promoCode}`}>
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              id="promo"
              className="input uppercase"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  apply();
                }
              }}
              placeholder="WELCOME10"
              aria-describedby="promo-help"
            />
            <button type="button" className="btn-secondary" onClick={apply}>
              Apply
            </button>
          </div>
        )}
        <p id="promo-help" className="mt-1.5 text-xs text-ink-400">
          Demo codes: WELCOME10 (10% off) · VAULT15 (15% off $150+)
        </p>
        {(localError || totals.promo.error) && (
          <p className="field-error" role="alert">
            {localError ?? totals.promo.error}
          </p>
        )}
      </div>

      <dl className="space-y-2 border-t border-ink-800 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-300">Subtotal</dt>
          <dd className="text-white">{fmt(totals.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-300">Discount</dt>
          <dd className={totals.discount > 0 ? 'text-emerald-300' : 'text-ink-400'}>
            {totals.discount > 0 ? `−${fmt(totals.discount)}` : fmt(0)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-300">Shipping{shippingLabel ? ` (${shippingLabel})` : ''}</dt>
          <dd className="text-white">{totals.shipping === null ? 'Calculated at checkout' : totals.shipping === 0 ? 'Free' : fmt(totals.shipping)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-300">Tax</dt>
          <dd className="text-ink-400">{fmt(totals.tax)} (demo: not charged)</dd>
        </div>
        <div className="flex justify-between border-t border-ink-800 pt-3 text-base">
          <dt className="font-semibold text-white">Total</dt>
          <dd className="font-display text-xl font-bold text-white">{fmt(totals.total)}</dd>
        </div>
      </dl>
      {children}
    </div>
  );
}
