import type { Brand, CatalogFacets, CatalogQuery, CatalogResult, Category, Product, Review } from '@/types';

export interface QuickSearchResult {
  products: Product[];
  categories: Category[];
}

/** Read-side catalog API implemented by both the Supabase and local preview backends. */
export interface CatalogApi {
  listCategories(): Promise<Category[]>;
  listBrands(): Promise<Brand[]>;
  getFacets(): Promise<CatalogFacets>;
  queryProducts(query: CatalogQuery): Promise<CatalogResult>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductsByIds(ids: string[]): Promise<Product[]>;
  getRelatedProducts(product: Product, limit?: number): Promise<Product[]>;
  quickSearch(term: string): Promise<QuickSearchResult>;
  listReviews(productId: string): Promise<Review[]>;
}

export const DEFAULT_PAGE_SIZE = 12;

export function makeQuery(partial: Partial<CatalogQuery> = {}): CatalogQuery {
  return {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sort: 'featured',
    categories: [],
    brands: [],
    franchises: [],
    scales: [],
    ...partial,
  };
}

/** Strips characters that have meaning in PostgREST filter syntax. */
export function sanitizeSearch(term: string): string {
  return term.replace(/[%,()*\\:."']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}
