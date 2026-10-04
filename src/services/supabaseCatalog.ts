import type { Brand, CatalogQuery, CatalogResult, Category, Product } from '@/types';
import { requireSupabase, throwIfError } from '@/lib/supabase';
import { mapBrand, mapCategory, mapProduct, mapReview, PRODUCT_SELECT } from './mappers';
import { sanitizeSearch, type CatalogApi } from './catalogTypes';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

let categoriesPromise: Promise<Category[]> | null = null;
let brandsPromise: Promise<Brand[]> | null = null;

/** Clears memoized taxonomy lists (called after admin edits). */
export function invalidateTaxonomyCache() {
  categoriesPromise = null;
  brandsPromise = null;
}

async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await requireSupabase()
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('position')
    .order('name');
  throwIfError(error);
  return (data ?? []).map(mapCategory);
}

async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await requireSupabase().from('brands').select('*').order('name');
  throwIfError(error);
  return (data ?? []).map(mapBrand);
}

function getCategories() {
  categoriesPromise ??= fetchCategories().catch((e) => {
    categoriesPromise = null;
    throw e;
  });
  return categoriesPromise;
}

function getBrands() {
  brandsPromise ??= fetchBrands().catch((e) => {
    brandsPromise = null;
    throw e;
  });
  return brandsPromise;
}

const idsOrNil = (ids: string[]) => (ids.length ? ids : [NIL_UUID]);

async function queryProducts(query: CatalogQuery): Promise<CatalogResult> {
  const sb = requireSupabase();
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);

  const build = (head: boolean) => {
    let req = sb.from('products').select(head ? 'id' : PRODUCT_SELECT, { count: 'exact', head }).eq('status', 'active');

    if (query.categories.length) {
      req = req.in('category_id', idsOrNil(categories.filter((c) => query.categories.includes(c.slug)).map((c) => c.id)));
    }
    if (query.brands.length) {
      req = req.in('brand_id', idsOrNil(brands.filter((b) => query.brands.includes(b.slug)).map((b) => b.id)));
    }
    if (query.franchises.length) req = req.in('franchise', query.franchises);
    if (query.scales.length) req = req.in('scale', query.scales);
    if (query.minPrice !== undefined) req = req.gte('price', query.minPrice);
    if (query.maxPrice !== undefined) req = req.lte('price', query.maxPrice);
    if (query.availability === 'in_stock') req = req.gt('inventory_quantity', 0);
    if (query.availability === 'out_of_stock') req = req.lte('inventory_quantity', 0);
    if (query.preorder === 'only') req = req.eq('badge', 'preorder');
    if (query.onSale) req = req.not('sale_price', 'is', null);
    if (query.featured) req = req.eq('featured', true);

    const orGroups: string[] = [];
    if (query.preorder === 'exclude') orGroups.push('badge.is.null,badge.neq.preorder');
    const term = query.search ? sanitizeSearch(query.search) : '';
    if (term) {
      const like = `%${term}%`;
      const brandIds = brands.filter((b) => b.name.toLowerCase().includes(term.toLowerCase())).map((b) => b.id);
      const parts = [`name.ilike.${like}`, `franchise.ilike.${like}`, `short_description.ilike.${like}`, `sku.ilike.${like}`];
      if (brandIds.length) parts.push(`brand_id.in.(${brandIds.join(',')})`);
      orGroups.push(parts.join(','));
    }
    if (orGroups.length === 1) req = req.or(orGroups[0]);
    if (orGroups.length > 1) req = req.or(`and(${orGroups.map((g) => `or(${g})`).join(',')})`);
    return req;
  };

  let req = build(false);
  switch (query.sort) {
    case 'newest':
      req = req.order('created_at', { ascending: false });
      break;
    case 'price_asc':
      req = req.order('price', { ascending: true });
      break;
    case 'price_desc':
      req = req.order('price', { ascending: false });
      break;
    case 'name_asc':
      req = req.order('name', { ascending: true });
      break;
    case 'name_desc':
      req = req.order('name', { ascending: false });
      break;
    case 'best_selling':
      req = req.order('sales_count', { ascending: false });
      break;
    default:
      req = req.order('featured', { ascending: false }).order('sales_count', { ascending: false });
  }
  req = req.order('id');

  const from = (query.page - 1) * query.pageSize;
  const { data, error, count } = await req.range(from, from + query.pageSize - 1);

  if (error && error.code === 'PGRST103') {
    // Requested page is past the end — report the real total with no items.
    const head = await build(true);
    throwIfError(head.error);
    const total = head.count ?? 0;
    return { items: [], total, page: query.page, pageSize: query.pageSize, pageCount: Math.max(1, Math.ceil(total / query.pageSize)) };
  }
  throwIfError(error);

  const total = count ?? 0;
  return {
    items: ((data ?? []) as unknown as Record<string, unknown>[]).map(mapProduct),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export const supabaseCatalog: CatalogApi = {
  listCategories: getCategories,
  listBrands: getBrands,

  async getFacets() {
    const { data, error } = await requireSupabase().rpc('get_catalog_facets');
    throwIfError(error);
    const d = (data ?? {}) as { franchises?: string[]; scales?: string[]; min_price?: number; max_price?: number };
    return {
      franchises: d.franchises ?? [],
      scales: d.scales ?? [],
      minPrice: Number(d.min_price ?? 0),
      maxPrice: Number(d.max_price ?? 0),
    };
  },

  queryProducts,

  async getProductBySlug(slug) {
    const { data, error } = await requireSupabase()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('slug', slug)
      .eq('status', 'active')
      .maybeSingle();
    throwIfError(error);
    return data ? mapProduct(data) : null;
  },

  async getProductsByIds(ids) {
    if (!ids.length) return [];
    const { data, error } = await requireSupabase().from('products').select(PRODUCT_SELECT).in('id', ids).eq('status', 'active');
    throwIfError(error);
    const products = (data ?? []).map(mapProduct);
    const order = new Map(ids.map((id, i) => [id, i]));
    return products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  },

  async getRelatedProducts(product: Product, limit = 4) {
    let req = requireSupabase()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('status', 'active')
      .neq('id', product.id);
    if (product.franchise && product.categoryId) {
      req = req.or(`category_id.eq.${product.categoryId},franchise.eq."${product.franchise}"`);
    } else if (product.categoryId) {
      req = req.eq('category_id', product.categoryId);
    }
    const { data, error } = await req.order('sales_count', { ascending: false }).limit(limit);
    throwIfError(error);
    return (data ?? []).map(mapProduct);
  },

  async quickSearch(term) {
    const clean = sanitizeSearch(term);
    if (!clean) return { products: [], categories: [] };
    const [result, categories] = await Promise.all([
      queryProducts({ page: 1, pageSize: 6, sort: 'best_selling', categories: [], brands: [], franchises: [], scales: [], search: clean }),
      getCategories(),
    ]);
    const lower = clean.toLowerCase();
    return { products: result.items, categories: categories.filter((c) => c.name.toLowerCase().includes(lower)).slice(0, 4) };
  },

  async listReviews(productId) {
    const { data, error } = await requireSupabase()
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(50);
    throwIfError(error);
    return (data ?? []).map(mapReview);
  },
};
