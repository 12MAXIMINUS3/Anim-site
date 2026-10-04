import type { Review, SiteSettings } from '@/types';
import { requireSupabase, supabase, throwIfError } from '@/lib/supabase';
import { seedSettings } from '@/data/seedProducts';
import { mapReview } from './mappers';

export async function subscribeNewsletter(email: string, source: string): Promise<'subscribed' | 'already'> {
  const { error } = await requireSupabase()
    .from('newsletter_subscribers')
    .insert({ email: email.trim().toLowerCase(), source });
  if (error?.code === '23505') return 'already';
  throwIfError(error);
  return 'subscribed';
}

export async function sendContactMessage(input: { name: string; email: string; subject: string; message: string }): Promise<void> {
  const { error } = await requireSupabase().from('contact_messages').insert(input);
  throwIfError(error);
}

export async function createReview(input: {
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
}): Promise<Review> {
  const { data, error } = await requireSupabase()
    .from('reviews')
    .insert({
      product_id: input.productId,
      user_id: input.userId,
      author_name: input.authorName,
      rating: input.rating,
      title: input.title,
      body: input.body,
    })
    .select()
    .single();
  if (error?.code === '23505') throw new Error('You have already reviewed this product.');
  throwIfError(error);
  return mapReview(data);
}

const SETTING_KEYS: Record<keyof SiteSettings, string> = {
  announcement: 'announcement',
  storeEmail: 'store_email',
  storePhone: 'store_phone',
  storeAddress: 'store_address',
  currency: 'currency',
  shippingMessage: 'shipping_message',
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (!supabase) return seedSettings;
  const { data, error } = await supabase.from('site_settings').select('key, value');
  throwIfError(error);
  const byKey = new Map((data ?? []).map((r) => [r.key as string, r.value]));
  const result = { ...seedSettings };
  (Object.keys(SETTING_KEYS) as Array<keyof SiteSettings>).forEach((k) => {
    const v = byKey.get(SETTING_KEYS[k]);
    if (typeof v === 'string') result[k] = v;
  });
  return result;
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  const rows = (Object.keys(SETTING_KEYS) as Array<keyof SiteSettings>).map((k) => ({
    key: SETTING_KEYS[k],
    value: settings[k],
  }));
  const { error } = await requireSupabase().from('site_settings').upsert(rows, { onConflict: 'key' });
  throwIfError(error);
}
