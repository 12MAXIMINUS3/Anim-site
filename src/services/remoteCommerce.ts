/** Supabase persistence for signed-in users' carts and wishlists. */
import type { CartLine } from '@/types';
import { requireSupabase, throwIfError } from '@/lib/supabase';

type RemoteLine = Pick<CartLine, 'productId' | 'variantId' | 'quantity'>;

async function getOrCreateCartId(userId: string): Promise<string> {
  const sb = requireSupabase();
  const { data, error } = await sb.from('carts').select('id').eq('user_id', userId).maybeSingle();
  throwIfError(error);
  if (data) return data.id as string;
  const created = await sb.from('carts').upsert({ user_id: userId }, { onConflict: 'user_id' }).select('id').single();
  throwIfError(created.error);
  return created.data!.id as string;
}

export async function fetchRemoteCart(userId: string): Promise<RemoteLine[]> {
  const cartId = await getOrCreateCartId(userId);
  const { data, error } = await requireSupabase().from('cart_items').select('product_id, variant_id, quantity').eq('cart_id', cartId);
  throwIfError(error);
  return (data ?? []).map((r) => ({ productId: r.product_id, variantId: r.variant_id, quantity: r.quantity }));
}

/** Replaces the user's remote cart with the given lines. */
export async function pushRemoteCart(userId: string, lines: RemoteLine[]): Promise<void> {
  const sb = requireSupabase();
  const cartId = await getOrCreateCartId(userId);
  const del = await sb.from('cart_items').delete().eq('cart_id', cartId);
  throwIfError(del.error);
  if (!lines.length) return;
  const ins = await sb.from('cart_items').insert(
    lines.map((l) => ({ cart_id: cartId, product_id: l.productId, variant_id: l.variantId, quantity: l.quantity })),
  );
  throwIfError(ins.error);
}

export async function fetchRemoteWishlist(userId: string): Promise<string[]> {
  const { data, error } = await requireSupabase()
    .from('wishlists')
    .select('product_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  throwIfError(error);
  return (data ?? []).map((r) => r.product_id as string);
}

export async function addRemoteWishlist(userId: string, productIds: string[]): Promise<void> {
  if (!productIds.length) return;
  const { error } = await requireSupabase()
    .from('wishlists')
    .upsert(productIds.map((product_id) => ({ user_id: userId, product_id })), { onConflict: 'user_id,product_id', ignoreDuplicates: true });
  throwIfError(error);
}

export async function removeRemoteWishlist(userId: string, productIds: string[]): Promise<void> {
  if (!productIds.length) return;
  const { error } = await requireSupabase().from('wishlists').delete().eq('user_id', userId).in('product_id', productIds);
  throwIfError(error);
}
