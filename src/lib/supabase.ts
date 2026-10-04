import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when real Supabase credentials are present (not the .env.example placeholders). */
export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('your-project-ref'));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export const PRODUCT_IMAGES_BUCKET = 'product-images';
export const SITE_IMAGES_BUCKET = 'site-images';

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local and restart the dev server.',
    );
  }
  return supabase;
}

interface PgError {
  message: string;
  code?: string;
  details?: string | null;
}

/** Throws a readable Error for a Supabase/PostgREST error result. */
export function throwIfError(error: PgError | null): void {
  if (!error) return;
  const err = new Error(error.message) as Error & { code?: string };
  err.code = error.code;
  throw err;
}

export function siteUrl(): string {
  return (import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin;
}
