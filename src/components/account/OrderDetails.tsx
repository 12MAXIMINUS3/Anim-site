import { useState } from 'react';
import { CalendarClock, CheckCircle2, CreditCard } from 'lucide-react';
import type { Order, OrderPayment, OrderStatus } from '@/types';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from '@/lib/format';
import { countryName } from '@/lib/countries';
import { INSTALLMENT_INTERVAL_DAYS, nextInstallmentAmount, PAYMENT_METHODS, SHIPPING_METHODS } from '@/lib/pricing';
import { payOrderBalance } from '@/services/orders';
import { friendlyError } from '@/lib/authErrors';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/cn';

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-400/15 text-amber-200',
  partially_paid: 'bg-orange-400/15 text-orange-200',
  paid_demo: 'bg-pulse-400/15 text-pulse-200',
  processing: 'bg-indigo-400/15 text-indigo-200',
  shipped: 'bg-nova-500/15 text-nova-200',
  delivered: 'bg-emerald-400/15 text-emerald-200',
  cancelled: 'bg-rose-500/15 text-rose-200',
};

const PAYMENT_KIND_LABELS: Record<OrderPayment['kind'], string> = {
  full: 'Full payment',
  deposit: 'Deposit (1st installment)',
  installment: 'Installment',
  balance: 'Remaining balance',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', STATUS_STYLES[status])}>{ORDER_STATUS_LABELS[status] ?? status}</span>;
}

/** Balance left to pay on an order (never negative). */
export const orderBalance = (o: Order) => Math.max(0, Math.round((o.total - o.amountPaid) * 100) / 100);

/** Payment plan progress, history and (for the customer) pay buttons. */
function PaymentPanel({ order, onPaid }: { order: Order; onPaid?: () => void }) {
  const [busy, setBusy] = useState<'installment' | 'balance' | null>(null);
  const fmt = (n: number) => formatCurrency(n, order.currency);
  const balance = orderBalance(order);
  const paidPct = order.total > 0 ? Math.min(100, (order.amountPaid / order.total) * 100) : 0;
  const isPlan = order.paymentPlan === 'installments';
  const next = nextInstallmentAmount(order.total, order.amountPaid, order.installmentCount);
  const paymentsMade = order.payments.length;
  const nextDue = isPlan && order.payments.length
    ? new Date(new Date(order.payments[order.payments.length - 1].createdAt).getTime() + INSTALLMENT_INTERVAL_DAYS * 86_400_000)
    : null;
  const canPay = Boolean(onPaid) && balance > 0 && order.status !== 'cancelled';

  const pay = async (kind: 'installment' | 'balance') => {
    setBusy(kind);
    try {
      const r = await payOrderBalance(order.id, kind);
      toast.success(
        r.balance <= 0 ? 'Order paid in full' : 'Payment received',
        r.balance <= 0 ? `${order.orderNumber} is fully paid — thank you!` : `Remaining balance: ${fmt(r.balance)}`,
      );
      onPaid?.();
    } catch (e) {
      toast.error('Payment failed', friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-850/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">
          {isPlan ? `Installment plan · ${order.installmentCount} payments` : 'Full payment'}
        </p>
        {balance <= 0 ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Paid in full
          </span>
        ) : (
          <span className="text-xs text-ink-300">
            Balance due <strong className="text-white">{fmt(balance)}</strong>
          </span>
        )}
      </div>

      <div className="mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(paidPct)} aria-label="Amount paid">
        <div className="h-2 overflow-hidden rounded-full bg-ink-700">
          <div className="h-full rounded-full bg-gradient-to-r from-nova-500 to-pulse-400 transition-all" style={{ width: `${paidPct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-ink-400">
          {fmt(order.amountPaid)} of {fmt(order.total)} paid
          {isPlan && balance > 0 ? ` · ${paymentsMade} of ${order.installmentCount} payments` : ''}
        </p>
      </div>

      {isPlan && balance > 0 && nextDue && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-300">
          <CalendarClock className="h-3.5 w-3.5 text-pulse-400" aria-hidden="true" />
          Next payment of {fmt(next)} due by {formatDate(nextDue.toISOString())}. Ships once paid in full.
        </p>
      )}

      {order.payments.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-ink-700 pt-3 text-xs">
          {order.payments.map((p) => (
            <li key={p.id} className="flex justify-between gap-3">
              <span className="text-ink-300">
                {formatDate(p.createdAt)} · {PAYMENT_KIND_LABELS[p.kind] ?? p.kind}
              </span>
              <span className="text-white">{fmt(p.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      {canPay && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {isPlan && next < balance && (
            <button type="button" className="btn-secondary whitespace-normal text-center" disabled={busy !== null} onClick={() => pay('installment')}>
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              {busy === 'installment' ? 'Paying…' : `Pay next installment · ${fmt(next)}`}
            </button>
          )}
          <button type="button" className={cn('btn-primary whitespace-normal text-center', !(isPlan && next < balance) && 'sm:col-span-2')} disabled={busy !== null} onClick={() => pay('balance')}>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {busy === 'balance' ? 'Paying…' : `Complete payment · ${fmt(balance)}`}
          </button>
          <p className="text-[11px] text-ink-500 sm:col-span-2">Demo payment — nothing is charged.</p>
        </div>
      )}
    </div>
  );
}

/**
 * Shared order breakdown used by the customer dashboard and the admin orders page.
 * Pass `onPaid` (customer view) to show the pay-installment / complete-payment buttons.
 */
export function OrderDetails({ order, onPaid }: { order: Order; onPaid?: () => void }) {
  const fmt = (n: number) => formatCurrency(n, order.currency);
  const a = order.shippingAddress;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
      <ul className="min-w-0 divide-y divide-ink-800">
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
      <div className="min-w-0 space-y-4 text-sm">
        <dl className="space-y-1.5">
          <div className="flex justify-between"><dt className="text-ink-400">Subtotal</dt><dd>{fmt(order.subtotal)}</dd></div>
          {order.discount > 0 && (
            <div className="flex justify-between"><dt className="text-ink-400">Discount{order.promoCode ? ` (${order.promoCode})` : ''}</dt><dd className="text-emerald-300">−{fmt(order.discount)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-ink-400">Shipping</dt><dd>{order.shipping === 0 ? 'Free' : fmt(order.shipping)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-400">Tax</dt><dd>{fmt(order.tax)}</dd></div>
          <div className="flex justify-between border-t border-ink-800 pt-1.5 font-semibold text-white"><dt>Total</dt><dd>{fmt(order.total)}</dd></div>
        </dl>
        <PaymentPanel order={order} onPaid={onPaid} />
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
