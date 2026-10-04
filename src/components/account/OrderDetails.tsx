import type { Order, OrderStatus } from '@/types';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { formatCurrency, ORDER_STATUS_LABELS } from '@/lib/format';
import { countryName } from '@/lib/countries';
import { PAYMENT_METHODS, SHIPPING_METHODS } from '@/lib/pricing';
import { cn } from '@/lib/cn';

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-400/15 text-amber-200',
  paid_demo: 'bg-pulse-400/15 text-pulse-200',
  processing: 'bg-indigo-400/15 text-indigo-200',
  shipped: 'bg-nova-500/15 text-nova-200',
  delivered: 'bg-emerald-400/15 text-emerald-200',
  cancelled: 'bg-rose-500/15 text-rose-200',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', STATUS_STYLES[status])}>{ORDER_STATUS_LABELS[status] ?? status}</span>;
}

/** Shared order breakdown used by the customer dashboard and the admin orders page. */
export function OrderDetails({ order }: { order: Order }) {
  const fmt = (n: number) => formatCurrency(n, order.currency);
  const a = order.shippingAddress;
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_260px]">
      <ul className="divide-y divide-ink-800">
        {order.items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 py-3">
            <ImageWithFallback src={i.imageUrl} alt="" className="h-14 w-12 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm text-white">{i.productName}</p>
              <p className="text-xs text-ink-400">
                {i.variantName ? `${i.variantName} · ` : ''}SKU {i.sku} · {i.quantity} × {fmt(i.unitPrice)}
              </p>
            </div>
            <span className="text-sm font-semibold text-white">{fmt(i.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <div className="space-y-4 text-sm">
        <dl className="space-y-1.5">
          <div className="flex justify-between"><dt className="text-ink-400">Subtotal</dt><dd>{fmt(order.subtotal)}</dd></div>
          {order.discount > 0 && (
            <div className="flex justify-between"><dt className="text-ink-400">Discount{order.promoCode ? ` (${order.promoCode})` : ''}</dt><dd className="text-emerald-300">−{fmt(order.discount)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-ink-400">Shipping</dt><dd>{order.shipping === 0 ? 'Free' : fmt(order.shipping)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-400">Tax</dt><dd>{fmt(order.tax)}</dd></div>
          <div className="flex justify-between border-t border-ink-800 pt-1.5 font-semibold text-white"><dt>Total</dt><dd>{fmt(order.total)}</dd></div>
        </dl>
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-400">Ship to</p>
          <address className="mt-1 not-italic text-ink-200">
            {a.fullName}<br />
            {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
            {a.city}, {a.state} {a.postalCode}<br />
            {countryName(a.country)}
          </address>
        </div>
        <p className="text-xs text-ink-400">
          {SHIPPING_METHODS.find((m) => m.id === order.shippingMethod)?.label ?? order.shippingMethod} shipping ·{' '}
          {PAYMENT_METHODS.find((m) => m.id === order.paymentMethod)?.label ?? order.paymentMethod}
        </p>
      </div>
    </div>
  );
}
