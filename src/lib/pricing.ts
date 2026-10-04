/**
 * Client-side pricing preview. The authoritative calculation runs in the
 * `create_order` Postgres function (supabase/schema.sql) — keep both in sync.
 */

export const FREE_SHIPPING_THRESHOLD = 200;
export const TAX_RATE = 0; // Placeholder: this demo store does not calculate tax.

export type ShippingMethodId = 'standard' | 'express' | 'overnight';

export interface ShippingMethod {
  id: ShippingMethodId;
  label: string;
  eta: string;
  price: number;
}

export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: 'standard', label: 'Standard', eta: '5–8 business days', price: 9.95 },
  { id: 'express', label: 'Express', eta: '2–3 business days', price: 24.95 },
  { id: 'overnight', label: 'Overnight', eta: 'Next business day', price: 39.95 },
];

export type PaymentMethodId = 'demo_card' | 'demo_wallet' | 'bank_transfer';

export const PAYMENT_METHODS: Array<{ id: PaymentMethodId; label: string; description: string }> = [
  { id: 'demo_card', label: 'Card (demo)', description: 'Simulated card payment. No card details are collected or charged.' },
  { id: 'demo_wallet', label: 'Digital wallet (demo)', description: 'Simulated wallet payment. Nothing is charged.' },
  { id: 'bank_transfer', label: 'Bank transfer', description: 'Order is created as “pending” until payment is confirmed manually.' },
];

export const PROMO_CODES: Record<string, { label: string; rate: number; minSubtotal: number }> = {
  WELCOME10: { label: '10% off your order', rate: 0.1, minSubtotal: 0 },
  VAULT15: { label: '15% off orders of $150 or more', rate: 0.15, minSubtotal: 150 },
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface PromoResult {
  code: string | null;
  discount: number;
  error: string | null;
}

export function evaluatePromo(rawCode: string | null | undefined, subtotal: number): PromoResult {
  const code = (rawCode ?? '').trim().toUpperCase();
  if (!code) return { code: null, discount: 0, error: null };
  const promo = PROMO_CODES[code];
  if (!promo) return { code, discount: 0, error: `“${code}” is not a valid promo code.` };
  if (subtotal < promo.minSubtotal) {
    return { code, discount: 0, error: `${code} applies to orders of $${promo.minSubtotal} or more.` };
  }
  return { code, discount: round2(subtotal * promo.rate), error: null };
}

export function shippingCost(method: ShippingMethodId, discountedSubtotal: number): number {
  const m = SHIPPING_METHODS.find((s) => s.id === method) ?? SHIPPING_METHODS[0];
  if (m.id === 'standard' && discountedSubtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return m.price;
}

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number | null;
  tax: number;
  total: number;
  promo: PromoResult;
}

/** When `shippingMethod` is null, shipping is not yet selected and excluded from the total. */
export function computeTotals(subtotal: number, promoCode: string | null, shippingMethod: ShippingMethodId | null): Totals {
  const promo = evaluatePromo(promoCode, subtotal);
  const discount = promo.error ? 0 : promo.discount;
  const shipping = shippingMethod ? shippingCost(shippingMethod, subtotal - discount) : null;
  const tax = round2((subtotal - discount) * TAX_RATE);
  const total = round2(subtotal - discount + (shipping ?? 0) + tax);
  return { subtotal: round2(subtotal), discount, shipping, tax, total, promo };
}

// ─────────────────────────── Payment plans ───────────────────────────
// Mirrored in supabase/schema.sql (_installment_amount, create_order, pay_order_balance).

export type PaymentPlanId = 'full' | 'installments';

/** Number of equal payments in an installment plan (the first is paid at checkout). */
export const INSTALLMENT_COUNT = 4;

/** Days between installment due dates (shown to customers as a guide). */
export const INSTALLMENT_INTERVAL_DAYS = 30;

/** The next payment due: an equal share, or the whole remainder when that's all that's left. */
export function nextInstallmentAmount(total: number, paid: number, count = INSTALLMENT_COUNT): number {
  const remaining = round2(total - paid);
  const share = round2(total / Math.max(count, 1));
  return remaining - share < 0.01 ? remaining : share;
}

export interface InstallmentScheduleItem {
  n: number;
  amount: number;
  /** ISO date the payment is due. */
  due: string;
}

/** Equal payments starting `from` (default today), one per interval. */
export function installmentSchedule(total: number, from: Date = new Date(), count = INSTALLMENT_COUNT): InstallmentScheduleItem[] {
  const items: InstallmentScheduleItem[] = [];
  let paid = 0;
  for (let n = 1; n <= count; n++) {
    const amount = nextInstallmentAmount(total, paid, count);
    const due = new Date(from.getTime() + (n - 1) * INSTALLMENT_INTERVAL_DAYS * 86_400_000);
    items.push({ n, amount, due: due.toISOString() });
    paid = round2(paid + amount);
  }
  return items;
}

/** Amount charged at checkout for the chosen plan (bank transfers pay nothing up front). */
export function dueToday(total: number, plan: PaymentPlanId, paymentMethod: PaymentMethodId): number {
  if (paymentMethod === 'bank_transfer') return 0;
  return plan === 'installments' ? nextInstallmentAmount(total, 0) : total;
}
