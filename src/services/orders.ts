import type { CartLine, ShippingAddress } from '@/types';
import type { PaymentMethodId, ShippingMethodId } from '@/lib/pricing';
import { requireSupabase, throwIfError } from '@/lib/supabase';

export interface PlaceOrderInput {
  email: string;
  fullName: string;
  phone: string;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethodId;
  paymentMethod: PaymentMethodId;
  promoCode: string | null;
  notes?: string;
  lines: CartLine[];
}

export interface PlacedOrder {
  orderId: string;
  orderNumber: string;
  total: number;
}

/**
 * Creates a DEMO order via the `create_order` Postgres function. No payment is
 * processed; prices, discounts, shipping and stock are validated server-side.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  const { data, error } = await requireSupabase().rpc('create_order', {
    p_email: input.email,
    p_full_name: input.fullName,
    p_phone: input.phone,
    p_shipping_address: input.shippingAddress,
    p_shipping_method: input.shippingMethod,
    p_payment_method: input.paymentMethod,
    p_items: input.lines.map((l) => ({ product_id: l.productId, variant_id: l.variantId, quantity: l.quantity })),
    p_promo_code: input.promoCode,
    p_notes: input.notes ?? null,
  });
  throwIfError(error);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('The order could not be created. Please try again.');
  return { orderId: row.order_id, orderNumber: row.order_number, total: Number(row.total) };
}
