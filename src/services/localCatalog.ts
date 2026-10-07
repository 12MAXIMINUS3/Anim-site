/**
 * Read-only "preview mode" catalog built from src/data/seedProducts.ts.
 * Used automatically when Supabase environment variables are not set, so the
 * storefront can be explored before the backend is connected.
 */
import type { Brand, CatalogQuery, Category, Product, Review } from '@/types';
import {
  categoryImagePath,
  productImagePaths,
  reviewsForSeedProduct,
  seedBrands,
  seedCategories,
  seedProducts,
} from '@/data/seedProducts';
import { sanitizeSearch, type CatalogApi } from './catalogTypes';

const NOW = Date.now();
const DAY = 86_400_000;

const categories: Category[] = seedCategories.map((c) => ({
  id: `cat-${c.slug}`,
  slug: c.slug,
  name: c.name,
  description: c.description,
  imageUrl: categoryImagePath(c.slug),
  position: c.position,
  isActive: true,
}));

const brands: Brand[] = seedBrands.map((b) => ({
  id: `brand-${b.slug}`,
  slug: b.slug,
  name: b.name,
  description: b.description,
  logoUrl: null,
}));

const reviewsByProduct = new Map<string, Review[]>();

const products: Product[] = seedProducts.map((p, index) => {
  const id = `prod-${p.slug}`;
  const category = categories.find((c) => c.slug === p.category) ?? null;
  const brand = brands.find((b) => b.slug === p.brand) ?? null;
  const reviews: Review[] = reviewsForSeedProduct(index).map((r, k) => ({
    id: `${id}-review-${k}`,
    productId: id,
    userId: null,
    authorName: r.authorName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: new Date(NOW - Math.max(1, p.daysAgo - k * 2 - 1) * DAY).toISOString(),
  }));
  reviewsByProduct.set(id, reviews);
  const created = new Date(NOW - p.daysAgo * DAY).toISOString();
  return {
    id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    fullDescription: p.fullDescription,
    categoryId: category?.id ?? null,
    brandId: brand?.id ?? null,
    category: category ? { id: category.id, slug: category.slug, name: category.name } : null,
    brand: brand ? { id: brand.id, slug: brand.slug, name: brand.name } : null,
    franchise: p.franchise,
    sku: p.sku,
    regularPrice: p.regularPrice,
    salePrice: p.salePrice,
    price: p.salePrice ?? p.regularPrice,
    currency: 'USD',
    inventoryQuantity: p.inventory,
    status: 'active',
    badge: p.badge,
    releaseDate: p.releaseDate,
    scale: p.scale,
    material: p.material,
    dimensions: p.dimensions,
    weight: p.weight,
    featured: p.featured,
    seoTitle: `${p.name} | Figure Haven`,
    seoDescription: p.shortDescription,
    ratingAvg: reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 100) / 100 : 0,
    ratingCount: reviews.length,
    salesCount: p.salesCount,
    images: productImagePaths(p.slug).map((url, i) => ({
      id: `${id}-img-${i + 1}`,
      url,
      alt: `${p.name} — ${i === 0 ? 'front view' : `view ${i + 1}`}`,
      position: i,
      storagePath: null,
    })),
    variants: (p.variants ?? []).map((v, i) => ({
      id: `${id}-variant-${i}`,
      name: v.name,
      sku: v.sku,
      price: v.price,
      inventoryQuantity: v.inventory,
      position: i,
    })),
    createdAt: created,
    updatedAt: created,
  };
});

function matches(p: Product, q: CatalogQuery): boolean {
  if (q.categories.length && !q.categories.includes(p.category?.slug ?? '')) return false;
  if (q.brands.length && !q.brands.includes(p.brand?.slug ?? '')) return false;
  if (q.franchises.length && !q.franchises.includes(p.franchise ?? '')) return false;
  if (q.scales.length && !q.scales.includes(p.scale ?? '')) return false;
  if (q.minPrice !== undefined && p.price < q.minPrice) return false;
  if (q.maxPrice !== undefined && p.price > q.maxPrice) return false;
  if (q.availability === 'in_stock' && p.inventoryQuantity <= 0) return false;
  if (q.availability === 'out_of_stock' && p.inventoryQuantity > 0) return false;
  if (q.preorder === 'only' && p.badge !== 'preorder') return false;
  if (q.preorder === 'exclude' && p.badge === 'preorder') return false;
  if (q.onSale && p.salePrice === null) return false;
  if (q.featured && !p.featured) return false;
  if (q.search) {
    const term = sanitizeSearch(q.search).toLowerCase();
    if (term) {
      const haystack = [p.name, p.franchise, p.shortDescription, p.sku, p.brand?.name].join(' ').toLowerCase();
      if (!haystack.includes(term)) return false;
    }
  }
  return true;
}

function sortProducts(list: Product[], sort: CatalogQuery['sort']): Product[] {
  const sorted = [...list];
  const byName = (a: Product, b: Product) => a.name.localeCompare(b.name);
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'name_asc':
      return sorted.sort(byName);
    case 'name_desc':
      return sorted.sort((a, b) => byName(b, a));
    case 'best_selling':
      return sorted.sort((a, b) => b.salesCount - a.salesCount);
    default:
      return sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || b.salesCount - a.salesCount);
  }
}

const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 120));

export const localCatalog: CatalogApi = {
  listCategories: () => delay(categories),
  listBrands: () => delay(brands),
  getFacets: () =>
    delay({
      franchises: [...new Set(products.map((p) => p.franchise).filter((f): f is string => Boolean(f)))].sort(),
      scales: [...new Set(products.map((p) => p.scale).filter((s): s is string => Boolean(s)))].sort(),
      minPrice: Math.min(...products.map((p) => p.price)),
      maxPrice: Math.max(...products.map((p) => p.price)),
    }),
  queryProducts(query) {
    const filtered = sortProducts(products.filter((p) => matches(p, query)), query.sort);
    const from = (query.page - 1) * query.pageSize;
    return delay({
      items: filtered.slice(from, from + query.pageSize),
      total: filtered.length,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(filtered.length / query.pageSize)),
    });
  },
  getProductBySlug: (slug) => delay(products.find((p) => p.slug === slug) ?? null),
  getProductsByIds: (ids) => delay(ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p))),
  getRelatedProducts: (product, limit = 4) =>
    delay(
      sortProducts(
        products.filter(
          (p) => p.id !== product.id && (p.categoryId === product.categoryId || (product.franchise && p.franchise === product.franchise)),
        ),
        'best_selling',
      ).slice(0, limit),
    ),
  quickSearch(term) {
    const clean = sanitizeSearch(term).toLowerCase();
    if (!clean) return delay({ products: [], categories: [] });
    return delay({
      products: sortProducts(
        products.filter((p) => matches(p, { page: 1, pageSize: 6, sort: 'best_selling', categories: [], brands: [], franchises: [], scales: [], search: clean })),
        'best_selling',
      ).slice(0, 6),
      categories: categories.filter((c) => c.name.toLowerCase().includes(clean)).slice(0, 4),
    });
  },
  listReviews: (productId) => delay(reviewsByProduct.get(productId) ?? []),
};
