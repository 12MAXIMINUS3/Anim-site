import type { HomeText, Review, SiteImages, SiteSettings } from '@/types';
import { ANIME_SERIES, type Series } from '@/data/series';
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

export const COMMUNITY_SLOTS = 8;

export const emptySiteImages = (): SiteImages => ({
  logo: null,
  favicon: null,
  hero: null,
  heroStage: null,
  heroLeft: null,
  heroCenter: null,
  heroRight: null,
  homeVideo: null,
  community: Array.from({ length: COMMUNITY_SLOTS }, () => null),
  series: {},
});

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null);

/** Site-wide images chosen in Admin → Site images (stored in site_settings as `site_images`). */
export async function fetchSiteImages(): Promise<SiteImages> {
  const base = emptySiteImages();
  if (!supabase) return base;
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'site_images').maybeSingle();
  throwIfError(error);
  const v = (data?.value ?? {}) as Record<string, unknown>;
  const community = Array.isArray(v.community) ? v.community : [];
  return {
    logo: str(v.logo),
    favicon: str(v.favicon),
    hero: str(v.hero),
    heroStage: str(v.heroStage),
    heroLeft: str(v.heroLeft),
    heroCenter: str(v.heroCenter),
    heroRight: str(v.heroRight),
    homeVideo: str(v.homeVideo),
    community: base.community.map((_, i) => str(community[i])),
    series: Object.fromEntries(
      Object.entries(v.series && typeof v.series === 'object' ? (v.series as Record<string, unknown>) : {}).flatMap(([k, u]) => {
        const url = str(u);
        return url ? [[k, url]] : [];
      }),
    ),
  };
}

export async function saveSiteImages(images: SiteImages): Promise<void> {
  const { error } = await requireSupabase().from('site_settings').upsert({ key: 'site_images', value: images }, { onConflict: 'key' });
  throwIfError(error);
}

// ─────────────────────── Series list & home text (admin-editable) ───────────────────────

export const DEFAULT_HOME_TEXT: HomeText = {
  badge: 'Autumn drops are live',
  title: 'Ultimate Anime Figures &',
  titleHighlight: 'Resin Collectibles',
  subtitle: 'New drops, trending statues, and limited editions — curated for collectors like you.',
  primaryCta: 'Shop New Arrivals',
  secondaryCta: 'Explore Collections',
  seriesEyebrow: 'Shop by anime',
  seriesTitle: 'Your favorite series, on your shelf',
  seriesLink: 'All figures',
};

/** Anime series list (site_settings `series`); falls back to the built-in list. */
export async function fetchSeries(): Promise<Series[]> {
  if (!supabase) return ANIME_SERIES;
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'series').maybeSingle();
  throwIfError(error);
  const list = Array.isArray(data?.value) ? (data!.value as Array<Record<string, unknown>>) : null;
  if (!list) return ANIME_SERIES;
  return list
    .filter((s) => typeof s.slug === 'string' && typeof s.name === 'string' && String(s.name).trim())
    .map((s) => ({
      slug: String(s.slug),
      name: String(s.name).trim(),
      colors: Array.isArray(s.colors) && s.colors.length === 2 ? [String(s.colors[0]), String(s.colors[1])] : ['#4c1d95', '#0e7490'],
    }));
}

export async function saveSeries(list: Series[]): Promise<void> {
  const value = list.map(({ slug, name, colors }) => ({ slug, name, colors }));
  const { error } = await requireSupabase().from('site_settings').upsert({ key: 'series', value }, { onConflict: 'key' });
  throwIfError(error);
}

export async function fetchHomeText(): Promise<HomeText> {
  if (!supabase) return DEFAULT_HOME_TEXT;
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'home_text').maybeSingle();
  throwIfError(error);
  const v = (data?.value ?? {}) as Record<string, unknown>;
  const pick = (k: keyof HomeText) => (typeof v[k] === 'string' ? (v[k] as string) : DEFAULT_HOME_TEXT[k]);
  return {
    badge: pick('badge'),
    title: pick('title'),
    titleHighlight: pick('titleHighlight'),
    subtitle: pick('subtitle'),
    primaryCta: pick('primaryCta'),
    secondaryCta: pick('secondaryCta'),
    seriesEyebrow: pick('seriesEyebrow'),
    seriesTitle: pick('seriesTitle'),
    seriesLink: pick('seriesLink'),
  };
}

export async function saveHomeText(text: HomeText): Promise<void> {
  const { error } = await requireSupabase().from('site_settings').upsert({ key: 'home_text', value: text }, { onConflict: 'key' });
  throwIfError(error);
}
