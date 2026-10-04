import type { Address, AddressInput, Order, Profile } from '@/types';
import { requireSupabase, throwIfError } from '@/lib/supabase';
import { mapAddress, mapOrder, mapProfile } from './mappers';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await requireSupabase().from('profiles').select('*').eq('id', userId).maybeSingle();
  throwIfError(error);
  return data ? mapProfile(data) : null;
}

export async function updateProfile(
  userId: string,
  patch: { fullName?: string; phone?: string | null; marketingOptIn?: boolean },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.fullName !== undefined) row.full_name = patch.fullName;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.marketingOptIn !== undefined) row.marketing_opt_in = patch.marketingOptIn;
  const { error } = await requireSupabase().from('profiles').update(row).eq('id', userId);
  throwIfError(error);
}

const addressRow = (userId: string, a: AddressInput) => ({
  user_id: userId,
  label: a.label,
  full_name: a.fullName,
  phone: a.phone,
  line1: a.line1,
  line2: a.line2,
  city: a.city,
  state: a.state,
  postal_code: a.postalCode,
  country: a.country,
  is_default: a.isDefault,
});

export async function listAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await requireSupabase()
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at');
  throwIfError(error);
  return (data ?? []).map(mapAddress);
}

async function clearDefault(userId: string, exceptId?: string) {
  let req = requireSupabase().from('addresses').update({ is_default: false }).eq('user_id', userId).eq('is_default', true);
  if (exceptId) req = req.neq('id', exceptId);
  const { error } = await req;
  throwIfError(error);
}

export async function saveAddress(userId: string, input: AddressInput, id?: string): Promise<Address> {
  const sb = requireSupabase();
  if (input.isDefault) await clearDefault(userId, id);
  const row = addressRow(userId, input);
  const { data, error } = id
    ? await sb.from('addresses').update(row).eq('id', id).select().single()
    : await sb.from('addresses').insert(row).select().single();
  throwIfError(error);
  return mapAddress(data);
}

export async function deleteAddress(id: string): Promise<void> {
  const { error } = await requireSupabase().from('addresses').delete().eq('id', id);
  throwIfError(error);
}

export async function listMyOrders(userId: string): Promise<Order[]> {
  const { data, error } = await requireSupabase()
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  throwIfError(error);
  return (data ?? []).map(mapOrder);
}
