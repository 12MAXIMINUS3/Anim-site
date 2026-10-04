import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { selectSubtotal, useCartStore } from '@/store/cartStore';
import { computeTotals } from '@/lib/pricing';
import { useSeo } from '@/lib/seo';
import { useSettings } from '@/context/SettingsContext';
import { useCartRefresh } from '@/hooks/useCartRefresh';
import { PageHeader } from '@/components/layout/PageHeader';
import { CartLineItem } from '@/components/product/CartLineItem';
import { OrderSummary } from '@/components/product/OrderSummary';
import { EmptyState } from '@/components/ui/States';

export default function CartPage() {
  useSeo({ title: 'Cart', noIndex: true });
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore(selectSubtotal);
  const promoCode = useCartStore((s) => s.promoCode);
  const clear = useCartStore((s) => s.clear);
  const { settings } = useSettings();
  const refreshing = useCartRefresh();
  const totals = computeTotals(subtotal, promoCode, null);

  return (
    <>
      <PageHeader title="Your cart" crumbs={[{ label: 'Cart' }]} />
      <div className="container-page py-10">
        {lines.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-7 w-7" aria-hidden="true" />}
            title="Your cart is empty"
            description="Looks like nothing has caught your eye yet."
            action={
              <Link to="/shop" className="btn-primary">
                Start shopping
              </Link>
            }
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <section aria-label="Cart items" className="card px-5" aria-busy={refreshing || undefined}>
              <ul className="divide-y divide-ink-800">
                {lines.map((l) => (
                  <CartLineItem key={`${l.productId}:${l.variantId}`} line={l} />
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-800 py-4">
                <Link to="/shop" className="text-sm font-semibold text-nova-300 hover:text-pulse-300">
                  ← Continue shopping
                </Link>
                <button type="button" onClick={clear} className="text-sm text-ink-400 hover:text-rose-300">
                  Empty cart
                </button>
              </div>
            </section>
            <aside>
              <OrderSummary totals={totals} currency={settings.currency}>
                <Link to="/checkout" className="btn-primary w-full py-3">
                  Proceed to checkout
                </Link>
                <p className="text-center text-xs text-ink-400">Demo store — no real payment will be taken.</p>
              </OrderSummary>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
