import type {
  Brand,
  Category,
  Order,
  OrderStatus,
  Product,
  ProductBadge,
  ProductImage,
  ProductStatus,
  Profile,
  UserRole,
} from '@/types';
import { PRODUCT_IMAGES_BUCKET, requireSupabase, throwIfError } from '@/lib/supabase';
import { mapBrand, mapCategory, mapOrder, mapProduct, mapProfile, PRODUCT_SELECT } from './mappers';
import { invalidateTaxonomyCache } from './supabaseCatalog';
import { sanitizeSearch } from './catalogTypes';

// ─────────────────────────────── Dashboard ────────────────────────────────

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStock: number;
  pendingOrders: number;
  totalCustomers: number;
  revenueDemo: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await requireSupabase().rpc('admin_dashboard_stats');
  throwIfError(error);
  const d = data as Record<string, number>;
  return {
    totalProducts: Number(d.total_products),
    activeProducts: Number(d.active_products),
    lowStock: Number(d.low_stock),
    pendingOrders: Number(d.pending_orders),
    totalCustomers: Number(d.total_customers),
    revenueDemo: Number(d.revenue_demo),
  };
}

export interface LowStockRow {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  threshold: number;
}

export async function getLowStock(limit = 8): Promise<LowStockRow[]> {
  const { data, error } = await requireSupabase().rpc('admin_low_stock', { p_limit: limit });
  throwIfError(error);
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    productId: r.product_id as string,
    name: r.name as string,
    sku: r.sku as string,
    quantity: Number(r.quantity),
    threshold: Number(r.low_stock_threshold),
  }));
}

// ──────────────────────────────── Products ────────────────────────────────

export interface AdminProductFilters {
  search: string;
  status: ProductStatus | '';
  categoryId: string;
  page: number;
  pageSize: number;
}

export async function adminListProducts(f: AdminProductFilters): Promise<{ items: Product[]; total: number }> {
  let req = requireSupabase().from('products').select(PRODUCT_SELECT, { count: 'exact' });
  if (f.status) req = req.eq('status', f.status);
  if (f.categoryId) req = req.eq('category_id', f.categoryId);
  const term = sanitizeSearch(f.search);
  if (term) req = req.or(`name.ilike.%${term}%,sku.ilike.%${term}%,franchise.ilike.%${term}%`);
  const from = (f.page - 1) * f.pageSize;
  const { data, error, count } = await req.order('updated_at', { ascending: false }).range(from, from + f.pageSize - 1);
  if (error?.code === 'PGRST103') return { items: [], total: count ?? 0 };
  throwIfError(error);
  return { items: (data ?? []).map(mapProduct), total: count ?? 0 };
}

export async function adminGetProduct(id: string): Promise<Product | null> {
  const { data, error } = await requireSupabase().from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
  throwIfError(error);
  return data ? mapProduct(data) : null;
}

export interface ProductInput {
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string | null;
  brandId: string | null;
  franchise: string | null;
  sku: string;
  regularPrice: number;
  salePrice: number | null;
  currency: string;
  inventoryQuantity: number;
  status: ProductStatus;
  badge: ProductBadge | null;
  releaseDate: string | null;
  scale: string | null;
  material: string | null;
  dimensions: string | null;
  weight: string | null;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

export async function saveProduct(input: ProductInput, id?: string): Promise<string> {
  const row = {
    slug: input.slug,
    name: input.name,
    short_description: input.shortDescription,
    full_description: input.fullDescription,
    category_id: input.categoryId,
    brand_id: input.brandId,
    franchise: input.franchise,
    sku: input.sku,
    regular_price: input.regularPrice,
    sale_price: input.salePrice,
    currency: input.currency,
    inventory_quantity: input.inventoryQuantity,
    status: input.status,
    badge: input.badge,
    release_date: input.releaseDate,
    scale: input.scale,
    material: input.material,
    dimensions: input.dimensions,
    weight: input.weight,
    featured: input.featured,
    seo_title: input.seoTitle,
    seo_description: input.seoDescription,
  };
  const sb = requireSupabase();
  const { data, error } = id
    ? await sb.from('products').update(row).eq('id', id).select('id').single()
    : await sb.from('products').insert(row).select('id').single();
  if (error?.code === '23505') throw new Error('A product with this slug or SKU already exists.');
  throwIfError(error);
  return data!.id as string;
}

export async function deleteProduct(product: Product): Promise<void> {
  const sb = requireSupabase();
  const paths = product.images.map((i) => i.storagePath).filter((p): p is string => Boolean(p));
  if (paths.length) await sb.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
  const { error } = await sb.from('products').delete().eq('id', product.id);
  if (error?.code === '23503') throw new Error('This product is referenced by existing orders. Archive it instead.');
  throwIfError(error);
}

export async function updateInventory(productId: string, quantity: number): Promise<void> {
  const { error } = await requireSupabase().from('products').update({ inventory_quantity: quantity }).eq('id', productId);
  throwIfError(error);
}

export interface VariantInput {
  id?: string;
  name: string;
  sku: string;
  price: number | null;
  inventoryQuantity: number;
}

export async function saveVariants(productId: string, variants: VariantInput[], existingIds: string[]): Promise<void> {
  const sb = requireSupabase();
  const keep = new Set(variants.map((v) => v.id).filter(Boolean));
  const removed = existingIds.filter((id) => !keep.has(id));
  if (removed.length) {
    const { error } = await sb.from('product_variants').delete().in('id', removed);
    throwIfError(error);
  }
  for (const [position, v] of variants.entries()) {
    const row = {
      product_id: productId,
      name: v.name,
      sku: v.sku,
      price: v.price,
      inventory_quantity: v.inventoryQuantity,
      position,
    };
    const { error } = v.id
      ? await sb.from('product_variants').update(row).eq('id', v.id)
      : await sb.from('product_variants').insert(row);
    if (error?.code === '23505') throw new Error(`Variant SKU “${v.sku}” is already in use.`);
    throwIfError(error);
  }
}

// ───────────────────────────────── Images ─────────────────────────────────

async function nextImagePosition(productId: string): Promise<number> {
  const { data, error } = await requireSupabase()
    .from('product_images')
    .select('position')
    .eq('product_id', productId)
    .order('position', { ascending: false })
    .limit(1);
  throwIfError(error);
  return data?.length ? Number(data[0].position) + 1 : 0;
}

export async function uploadProductImage(productId: string, file: File, alt: string): Promise<void> {
  const sb = requireSupabase();
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
  if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} is larger than 5 MB.`);
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const base = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'image';
  const path = `${productId}/${Date.now()}-${base}.${ext}`;
  const up = await sb.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type });
  throwIfError(up.error);
  const { data: pub } = sb.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  const position = await nextImagePosition(productId);
  const { error } = await sb.from('product_images').insert({ product_id: productId, url: pub.publicUrl, storage_path: path, alt, position });
  if (error) {
    await sb.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
    throwIfError(error);
  }
}

export async function addImageByUrl(productId: string, url: string, alt: string): Promise<void> {
  const position = await nextImagePosition(productId);
  const { error } = await requireSupabase().from('product_images').insert({ product_id: productId, url, alt, position });
  throwIfError(error);
}

export async function updateImage(id: string, patch: { alt?: string; position?: number }): Promise<void> {
  const { error } = await requireSupabase().from('product_images').update(patch).eq('id', id);
  throwIfError(error);
}

export async function deleteImage(image: ProductImage): Promise<void> {
  const sb = requireSupabase();
  if (image.storagePath) {
    const rm = await sb.storage.from(PRODUCT_IMAGES_BUCKET).remove([image.storagePath]);
    throwIfError(rm.error);
  }
  const { error } = await sb.from('product_images').delete().eq('id', image.id);
  throwIfError(error);
}

// ──────────────────────────── Categories & brands ─────────────────────────

export async function adminListCategories(): Promise<Category[]> {
  const { data, error } = await requireSupabase().from('categories').select('*').order('position').order('name');
  throwIfError(error);
  return (data ?? []).map(mapCategory);
}

export async function saveCategory(input: Omit<Category, 'id'>, id?: string): Promise<void> {
  const row = {
    slug: input.slug,
    name: input.name,
    description: input.description,
    image_url: input.imageUrl,
    position: input.position,
    is_active: input.isActive,
  };
  const sb = requireSupabase();
  const { error } = id ? await sb.from('categories').update(row).eq('id', id) : await sb.from('categories').insert(row);
  if (error?.code === '23505') throw new Error('A category with this slug already exists.');
  throwIfError(error);
  invalidateTaxonomyCache();
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await requireSupabase().from('categories').delete().eq('id', id);
  throwIfError(error);
  invalidateTaxonomyCache();
}

export async function adminListBrands(): Promise<Brand[]> {
  const { data, error } = await requireSupabase().from('brands').select('*').order('name');
  throwIfError(error);
  return (data ?? []).map(mapBrand);
}

export async function saveBrand(input: Omit<Brand, 'id'>, id?: string): Promise<void> {
  const row = { slug: input.slug, name: input.name, description: input.description, logo_url: input.logoUrl };
  const sb = requireSupabase();
  const { error } = id ? await sb.from('brands').update(row).eq('id', id) : await sb.from('brands').insert(row);
  if (error?.code === '23505') throw new Error('A brand with this slug already exists.');
  throwIfError(error);
  invalidateTaxonomyCache();
}

export async function deleteBrand(id: string): Promise<void> {
  const { error } = await requireSupabase().from('brands').delete().eq('id', id);
  throwIfError(error);
  invalidateTaxonomyCache();
}

// ───────────────────────────────── Orders ─────────────────────────────────

export async function adminListOrders(f: {
  status: OrderStatus | '';
  search: string;
  page: number;
  pageSize: number;
}): Promise<{ items: Order[]; total: number }> {
  let req = requireSupabase().from('orders').select('*, items:order_items(*), payments:order_payments(*)', { count: 'exact' });
  if (f.status) req = req.eq('status', f.status);
  // Keep "-" and "@" so order numbers and emails can be searched.
  const raw = f.search.trim().replace(/[%,()*\\:"']/g, '');
  if (raw) req = req.or(`order_number.ilike.%${raw}%,email.ilike.%${raw}%,full_name.ilike.%${raw}%`);
  const from = (f.page - 1) * f.pageSize;
  const { data, error, count } = await req.order('created_at', { ascending: false }).range(from, from + f.pageSize - 1);
  if (error?.code === 'PGRST103') return { items: [], total: count ?? 0 };
  throwIfError(error);
  return { items: (data ?? []).map(mapOrder), total: count ?? 0 };
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await requireSupabase().from('orders').update({ status }).eq('id', id);
  throwIfError(error);
}

// ──────────────────────────────── Customers ───────────────────────────────

export interface CustomerRow extends Profile {
  orderCount: number;
}

export async function adminListCustomers(f: { search: string; page: number; pageSize: number }): Promise<{ items: CustomerRow[]; total: number }> {
  const sb = requireSupabase();
  let req = sb.from('profiles').select('*', { count: 'exact' });
  const term = f.search.trim().replace(/[%,()*\\:"']/g, '');
  if (term) req = req.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
  const from = (f.page - 1) * f.pageSize;
  const { data, error, count } = await req.order('created_at', { ascending: false }).range(from, from + f.pageSize - 1);
  if (error?.code === 'PGRST103') return { items: [], total: count ?? 0 };
  throwIfError(error);
  const profiles = (data ?? []).map(mapProfile);
  const counts = new Map<string, number>();
  if (profiles.length) {
    const orders = await sb.from('orders').select('user_id').in('user_id', profiles.map((p) => p.id));
    throwIfError(orders.error);
    for (const o of orders.data ?? []) counts.set(o.user_id as string, (counts.get(o.user_id as string) ?? 0) + 1);
  }
  return { items: profiles.map((p) => ({ ...p, orderCount: counts.get(p.id) ?? 0 })), total: count ?? 0 };
}

export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await requireSupabase().from('profiles').update({ role }).eq('id', userId);
  throwIfError(error);
}
