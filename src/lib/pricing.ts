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
