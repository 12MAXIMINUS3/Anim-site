export type ProductStatus = 'draft' | 'active' | 'archived';
export type ProductBadge = 'new' | 'sale' | 'preorder' | 'limited' | 'sold_out';
export type OrderStatus = 'pending' | 'partially_paid' | 'paid_demo' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentPlan = 'full' | 'installments';
export type UserRole = 'customer' | 'admin';

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  position: number;
  isActive: boolean;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
  storagePath: string | null;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number | null;
  inventoryQuantity: number;
  position: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string | null;
  brandId: string | null;
  category: Pick<Category, 'id' | 'slug' | 'name'> | null;
  brand: Pick<Brand, 'id' | 'slug' | 'name'> | null;
  franchise: string | null;
  sku: string;
  regularPrice: number;
  salePrice: number | null;
  /** Effective selling price: sale price when present, otherwise regular price. */
  price: number;
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
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string | null;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

export type SortOption =
  | 'featured'
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'name_asc'
  | 'name_desc'
  | 'best_selling';

export interface CatalogQuery {
  page: number;
  pageSize: number;
  sort: SortOption;
  categories: string[];
  brands: string[];
  franchises: string[];
  scales: string[];
  minPrice?: number;
  maxPrice?: number;
  availability?: 'in_stock' | 'out_of_stock';
  preorder?: 'only' | 'exclude';
  onSale?: boolean;
  featured?: boolean;
  search?: string;
}

export interface CatalogResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface CatalogFacets {
  franchises: string[];
  scales: string[];
  minPrice: number;
  maxPrice: number;
}

export interface CartLineSnapshot {
  slug: string;
  name: string;
  brandName: string | null;
  image: string | null;
  imageAlt: string;
  unitPrice: number;
  compareAtPrice: number | null;
  currency: string;
  sku: string;
  variantName: string | null;
  maxQuantity: number;
  isPreorder: boolean;
}

export interface CartLine {
  productId: string;
  variantId: string | null;
  quantity: number;
  snapshot: CartLineSnapshot;
}

export interface Profile {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  role: UserRole;
  marketingOptIn: boolean;
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export type AddressInput = Omit<Address, 'id'>;

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  email: string;
  fullName: string;
  phone: string | null;
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  paymentMethod: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  promoCode: string | null;
  createdAt: string;
  items: OrderItem[];
  paymentPlan: PaymentPlan;
  /** Total number of payments in the plan (1 for full payment, 4 for installments). */
  installmentCount: number;
  amountPaid: number;
  payments: OrderPayment[];
}

export interface OrderPayment {
  id: string;
  amount: number;
  method: string;
  kind: 'full' | 'deposit' | 'installment' | 'balance';
  createdAt: string;
}

export interface SiteSettings {
  announcement: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currency: string;
  shippingMessage: string;
}

/** Admin-managed images for site-wide slots (null = use the built-in default). */
export interface SiteImages {
  /** Store logo shown in the header, footer, login and admin (replaces the built-in logo). */
  logo: string | null;
  /** Browser-tab icon. */
  favicon: string | null;
  /** Full hero banner image (used when no hero figures are set). */
  hero: string | null;
  /** Background behind the three hero figures. */
  heroStage: string | null;
  heroLeft: string | null;
  heroCenter: string | null;
  heroRight: string | null;
  /** Looping background video behind the home hero. */
  homeVideo: string | null;
  /** "From the community" gallery, 8 slots. */
  community: Array<string | null>;
  /** "Shop by anime" tile pictures, keyed by series slug (missing = colour tile). */
  series: Record<string, string>;
}
