/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Address, Brand, Category, Order, OrderItem, Product, Profile, Review } from '@/types';

type Row = Record<string, any>;

const n = (v: unknown): number => (v === null || v === undefined ? 0 : Number(v));
const nn = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

export const PRODUCT_SELECT =
  '*, category:categories(id,slug,name), brand:brands(id,slug,name), images:product_images(id,url,alt,position,storage_path), variants:product_variants(id,name,sku,price,inventory_quantity,position)';

export function mapCategory(r: Row): Category {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? null,
    imageUrl: r.image_url ?? null,
    position: n(r.position),
    isActive: r.is_active ?? true,
  };
}

export function mapBrand(r: Row): Brand {
  return { id: r.id, slug: r.slug, name: r.name, description: r.description ?? null, logoUrl: r.logo_url ?? null };
}

export function mapProduct(r: Row): Product {
  const images = ((r.images ?? []) as Row[])
    .map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? '', position: n(i.position), storagePath: i.storage_path ?? null }))
    .sort((a, b) => a.position - b.position);
  const variants = ((r.variants ?? []) as Row[])
    .map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: nn(v.price),
      inventoryQuantity: n(v.inventory_quantity),
      position: n(v.position),
    }))
    .sort((a, b) => a.position - b.position);
  const regular = n(r.regular_price);
  const sale = nn(r.sale_price);
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    shortDescription: r.short_description ?? '',
    fullDescription: r.full_description ?? '',
    categoryId: r.category_id ?? null,
    brandId: r.brand_id ?? null,
    category: r.category ? { id: r.category.id, slug: r.category.slug, name: r.category.name } : null,
    brand: r.brand ? { id: r.brand.id, slug: r.brand.slug, name: r.brand.name } : null,
    franchise: r.franchise ?? null,
    sku: r.sku,
    regularPrice: regular,
    salePrice: sale,
    price: r.price !== undefined && r.price !== null ? n(r.price) : sale ?? regular,
    currency: r.currency ?? 'USD',
    inventoryQuantity: n(r.inventory_quantity),
    status: r.status,
    badge: r.badge ?? null,
    releaseDate: r.release_date ?? null,
    scale: r.scale ?? null,
    material: r.material ?? null,
    dimensions: r.dimensions ?? null,
    weight: r.weight ?? null,
    featured: Boolean(r.featured),
    seoTitle: r.seo_title ?? null,
    seoDescription: r.seo_description ?? null,
    ratingAvg: n(r.rating_avg),
    ratingCount: n(r.rating_count),
    salesCount: n(r.sales_count),
    images,
    variants,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapReview(r: Row): Review {
  return {
    id: r.id,
    productId: r.product_id,
    userId: r.user_id ?? null,
    authorName: r.author_name,
    rating: n(r.rating),
    title: r.title ?? '',
    body: r.body ?? '',
    createdAt: r.created_at,
  };
}

export function mapProfile(r: Row): Profile {
  return {
    id: r.id,
    email: r.email ?? null,
    fullName: r.full_name ?? null,
    phone: r.phone ?? null,
    role: r.role === 'admin' ? 'admin' : 'customer',
    marketingOptIn: Boolean(r.marketing_opt_in),
    createdAt: r.created_at,
  };
}

export function mapAddress(r: Row): Address {
  return {
    id: r.id,
    label: r.label,
    fullName: r.full_name,
    phone: r.phone ?? null,
    line1: r.line1,
    line2: r.line2 ?? null,
    city: r.city,
    state: r.state,
    postalCode: r.postal_code,
    country: r.country,
    isDefault: Boolean(r.is_default),
  };
}

export function mapOrderItem(r: Row): OrderItem {
  return {
    id: r.id,
    productId: r.product_id ?? null,
    variantId: r.variant_id ?? null,
    productName: r.product_name,
    variantName: r.variant_name ?? null,
    sku: r.sku ?? null,
    imageUrl: r.image_url ?? null,
    unitPrice: n(r.unit_price),
    quantity: n(r.quantity),
    lineTotal: n(r.line_total),
  };
}

export function mapOrder(r: Row): Order {
  return {
    id: r.id,
    orderNumber: r.order_number,
    userId: r.user_id ?? null,
    email: r.email,
    fullName: r.full_name,
    phone: r.phone ?? null,
    shippingAddress: r.shipping_address ?? {},
    shippingMethod: r.shipping_method,
    paymentMethod: r.payment_method,
    status: r.status,
    subtotal: n(r.subtotal),
    discount: n(r.discount),
    shipping: n(r.shipping),
    tax: n(r.tax),
    total: n(r.total),
    currency: r.currency ?? 'USD',
    promoCode: r.promo_code ?? null,
    createdAt: r.created_at,
    items: ((r.items ?? r.order_items ?? []) as Row[]).map(mapOrderItem),
  };
}
