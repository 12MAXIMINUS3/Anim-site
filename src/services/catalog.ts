import { isSupabaseConfigured } from '@/lib/supabase';
import { localCatalog } from './localCatalog';
import { supabaseCatalog } from './supabaseCatalog';
import type { CatalogApi } from './catalogTypes';

export { makeQuery, DEFAULT_PAGE_SIZE } from './catalogTypes';
export { invalidateTaxonomyCache } from './supabaseCatalog';

/** The active catalog backend: Supabase when configured, otherwise the local preview data. */
export const catalog: CatalogApi = isSupabaseConfigured ? supabaseCatalog : localCatalog;
