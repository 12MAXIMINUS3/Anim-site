import type { CartLineSnapshot, Product, ProductBadge, ProductVariant } from '@/types';

export const MAX_PER_LINE = 20;

export const BADGE_LABELS: Record<ProductBadge, string> = {
  new: 'New',
  sale: 'Sale',
  preorder: 'Preorder',
  limited: 'Limited',
  sold_out: 'Sold Out',
};

export function isSoldOut(product: Product, variant?: ProductVariant | null): boolean {
  if (variant) return variant.inventoryQuantity <= 0;
  return product.inventoryQuantity <= 0;
}

export function isPreorder(product: Product): boolean {
  return product.badge === 'preorder';
}

/** The badge to show on cards: stock state wins, then explicit badge, then sale. */
export function displayBadge(product: Product): ProductBadge | null {
  if (product.inventoryQuantity <= 0) return 'sold_out';
  if (product.badge && product.badge !== 'sold_out') return product.badge;
  if (product.salePrice !== null) return 'sale';
  return null;
}

export function variantPrice(product: Product, variant: ProductVariant | null): number {
  return variant?.price ?? product.price;
}

export function primaryImage(product: Product) {
  return product.images[0] ?? null;
}

export function buildSnapshot(product: Product, variant: ProductVariant | null): CartLineSnapshot {
  const img = primaryImage(product);
  const unitPrice = variantPrice(product, variant);
  const compareAt = variant?.price != null ? null : product.salePrice !== null ? product.regularPrice : null;
  return {
    slug: product.slug,
    name: product.name,
    brandName: product.brand?.name ?? null,
    image: img?.url ?? null,
    imageAlt: img?.alt ?? product.name,
    unitPrice,
    compareAtPrice: compareAt,
    currency: product.currency,
    sku: variant?.sku ?? product.sku,
    variantName: variant?.name ?? null,
    maxQuantity: Math.min(MAX_PER_LINE, variant ? variant.inventoryQuantity : product.inventoryQuantity),
    isPreorder: isPreorder(product),
  };
}

export function availabilityLabel(product: Product, variant?: ProductVariant | null): { label: string; tone: 'ok' | 'low' | 'out' | 'pre' } {
  const qty = variant ? variant.inventoryQuantity : product.inventoryQuantity;
  if (qty <= 0) return { label: 'Sold out', tone: 'out' };
  if (isPreorder(product)) return { label: 'Preorder open', tone: 'pre' };
  if (qty <= 5) return { label: `Only ${qty} left`, tone: 'low' };
  return { label: 'In stock', tone: 'ok' };
}

export function careInstructions(categorySlug: string | undefined): string[] {
  switch (categorySlug) {
    case 'display-cases':
      return [
        'Clean acrylic with a damp microfiber cloth only — never use alcohol or ammonia cleaners.',
        'Keep out of direct sunlight to prevent yellowing of panels.',
        'Tighten hardware gently; over-tightening can crack acrylic.',
      ];
    case 'accessories':
      return [
        'Store in a cool, dry place away from direct sunlight.',
        'Wipe clean with a dry, lint-free cloth.',
        'Check clips and joints periodically for wear.',
      ];
    case 'statues':
    case 'limited-editions':
      return [
        'Lift statues by the base, never by protruding parts.',
        'Dust weekly with a soft brush; avoid water on polystone surfaces.',
        'Display away from heat sources and direct sunlight to protect paint.',
        'Keep the original packaging and foam for moving or storage.',
      ];
    default:
      return [
        'Dust regularly with a soft brush or manual air blower.',
        'Avoid direct sunlight and humidity to prevent fading and leaning.',
        'If a peg is tight, warm it gently with a hair dryer before assembly.',
        'Keep the box and inserts for long-term storage.',
      ];
  }
}
