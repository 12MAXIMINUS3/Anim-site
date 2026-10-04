import type { CatalogQuery, SortOption } from '@/types';
import { makeQuery } from '@/services/catalog';

export const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name_asc', label: 'Name: A–Z' },
  { value: 'name_desc', label: 'Name: Z–A' },
];

const SORT_VALUES = new Set<string>([...SORT_OPTIONS.map((o) => o.value), 'best_selling']);

const num = (v: string | null): number | undefined => {
  if (v === null || v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** Reads catalog filters from URL search params. */
export function parseCatalogParams(params: URLSearchParams): Omit<CatalogQuery, 'page' | 'pageSize'> {
  const sort = params.get('sort') ?? 'featured';
  const availability = params.get('availability');
  const preorder = params.get('preorder');
  const base = makeQuery();
  return {
    sort: (SORT_VALUES.has(sort) ? sort : 'featured') as SortOption,
    categories: params.getAll('category'),
    brands: params.getAll('brand'),
    franchises: params.getAll('franchise'),
    scales: params.getAll('scale'),
    minPrice: num(params.get('min')),
    maxPrice: num(params.get('max')),
    availability: availability === 'in_stock' || availability === 'out_of_stock' ? availability : undefined,
    preorder: preorder === 'only' || preorder === 'exclude' ? preorder : undefined,
    onSale: params.get('sale') === '1' || undefined,
    search: params.get('q') ?? base.search,
  };
}

/** Counts active (user-visible) filters, excluding sort and search. */
export function countActiveFilters(params: URLSearchParams, ignoreCategory = false): number {
  let n = 0;
  for (const key of ['brand', 'franchise', 'scale'] as const) n += params.getAll(key).length;
  if (!ignoreCategory) n += params.getAll('category').length;
  for (const key of ['min', 'max', 'availability', 'preorder', 'sale'] as const) if (params.get(key)) n += 1;
  return n;
}
