import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import type { Product } from '@/types';
import { adminGetProduct, adminListBrands, adminListCategories, saveProduct, saveVariants } from '@/services/admin';
import { useAsync } from '@/hooks/useAsync';
import { slugify } from '@/lib/format';
import { friendlyError } from '@/lib/authErrors';
import { toast } from '@/store/toastStore';
import { Field, FormAlert } from '@/components/ui/FormField';
import { ErrorState, Spinner } from '@/components/ui/States';
import { ProductImagesManager } from '@/components/admin/ProductImagesManager';
import { AdminPageHeader } from './AdminLayout';
import { useSettings } from '@/context/SettingsContext';

const money = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount like 49.99');
const optionalMoney = money.or(z.literal(''));
const wholeNumber = z.string().trim().regex(/^\d+$/, 'Enter a whole number');
const optionalText = z.string().trim().max(200).optional();

const schema = z
  .object({
    name: z.string().trim().min(3, 'Name is required').max(140),
    slug: z.string().trim().min(3, 'Slug is required').max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes'),
    sku: z.string().trim().min(3, 'SKU is required').max(40),
    shortDescription: z.string().trim().min(10, 'Add a short description').max(300),
    fullDescription: z.string().trim().min(20, 'Add a full description').max(5000),
    categoryId: z.string(),
    brandId: z.string(),
    franchise: optionalText,
    regularPrice: money,
    salePrice: optionalMoney,
    currency: z.string().length(3, 'Use a 3-letter currency code'),
    inventoryQuantity: wholeNumber,
    status: z.enum(['draft', 'active', 'archived']),
    badge: z.enum(['', 'new', 'sale', 'preorder', 'limited', 'sold_out']),
    releaseDate: z.string().optional(),
    scale: optionalText,
    material: optionalText,
    dimensions: optionalText,
    weight: optionalText,
    featured: z.boolean(),
    seoTitle: z.string().trim().max(70, 'Keep SEO titles under 70 characters').optional(),
    seoDescription: z.string().trim().max(160, 'Keep SEO descriptions under 160 characters').optional(),
    variants: z.array(
      z.object({
        id: z.string().optional(),
        name: z.string().trim().min(1, 'Name required'),
        sku: z.string().trim().min(3, 'SKU required'),
        price: optionalMoney,
        inventoryQuantity: wholeNumber,
      }),
    ),
  })
  .superRefine((v, ctx) => {
    if (v.salePrice && Number(v.salePrice) >= Number(v.regularPrice)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['salePrice'], message: 'Sale price must be lower than the regular price' });
    }
    const skus = v.variants.map((x) => x.sku.toLowerCase());
    skus.forEach((s, i) => {
      if (skus.indexOf(s) !== i) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['variants', i, 'sku'], message: 'Duplicate SKU' });
    });
  });
type Values = z.infer<typeof schema>;

const toValues = (p: Product | null): Values => ({
  name: p?.name ?? '',
  slug: p?.slug ?? '',
  sku: p?.sku ?? '',
  shortDescription: p?.shortDescription ?? '',
  fullDescription: p?.fullDescription ?? '',
  categoryId: p?.categoryId ?? '',
  brandId: p?.brandId ?? '',
  franchise: p?.franchise ?? '',
  regularPrice: p ? p.regularPrice.toFixed(2) : '',
  salePrice: p?.salePrice != null ? p.salePrice.toFixed(2) : '',
  currency: p?.currency ?? 'USD',
  inventoryQuantity: String(p?.inventoryQuantity ?? 0),
  status: p?.status ?? 'draft',
  badge: p?.badge ?? '',
  releaseDate: p?.releaseDate ?? '',
  scale: p?.scale ?? '',
  material: p?.material ?? '',
  dimensions: p?.dimensions ?? '',
  weight: p?.weight ?? '',
  featured: p?.featured ?? false,
  seoTitle: p?.seoTitle ?? '',
  seoDescription: p?.seoDescription ?? '',
  variants: (p?.variants ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    price: v.price != null ? v.price.toFixed(2) : '',
    inventoryQuantity: String(v.inventoryQuantity),
  })),
});

const orNull = (s: string | undefined) => (s && s.trim() ? s.trim() : null);

/** Keyed wrapper so switching between /new and /:id/edit remounts the form with fresh state. */
export default function AdminProductEditorPage() {
  const { id } = useParams();
  return <AdminProductEditor key={id ?? 'new'} id={id} />;
}

function AdminProductEditor({ id }: { id?: string }) {
  const { series } = useSettings();
  const isNew = !id;
  const navigate = useNavigate();
  const taxonomy = useAsync(() => Promise.all([adminListCategories(), adminListBrands()]), []);
  const productState = useAsync(() => (id ? adminGetProduct(id) : Promise.resolve(null)), [id]);
  const product = productState.data ?? null;
  const [serverError, setServerError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(null) });
  const variants = useFieldArray({ control, name: 'variants' });

  // Populate the form when the product first loads (and after a save), but not
  // after image-only reloads, so unsaved field edits are preserved.
  const formSynced = useRef(false);
  useEffect(() => {
    if (product && !formSynced.current) {
      reset(toValues(product));
      formSynced.current = true;
    }
  }, [product, reset]);

  const name = watch('name');
  useEffect(() => {
    if (!slugTouched) setValue('slug', slugify(name), { shouldValidate: false });
  }, [name, slugTouched, setValue]);

  if ((productState.loading && !productState.data) || (taxonomy.loading && !taxonomy.data)) return <Spinner label="Loading product" />;
  if (productState.error) return <ErrorState error={productState.error} onRetry={productState.reload} />;
  if (taxonomy.error) return <ErrorState error={taxonomy.error} onRetry={taxonomy.reload} />;
  if (!isNew && !product) return <ErrorState title="Product not found" />;

  const [categories, brands] = taxonomy.data ?? [[], []];
  const hasVariants = variants.fields.length > 0;

  const onSubmit = async (v: Values) => {
    setServerError(null);
    try {
      const variantTotal = v.variants.reduce((s, x) => s + Number(x.inventoryQuantity), 0);
      const productId = await saveProduct(
        {
          name: v.name,
          slug: v.slug,
          sku: v.sku,
          shortDescription: v.shortDescription,
          fullDescription: v.fullDescription,
          categoryId: v.categoryId || null,
          brandId: v.brandId || null,
          franchise: orNull(v.franchise),
          regularPrice: Number(v.regularPrice),
          salePrice: v.salePrice ? Number(v.salePrice) : null,
          currency: v.currency.toUpperCase(),
          inventoryQuantity: v.variants.length ? variantTotal : Number(v.inventoryQuantity),
          status: v.status,
          badge: v.badge || null,
          releaseDate: orNull(v.releaseDate),
          scale: orNull(v.scale),
          material: orNull(v.material),
          dimensions: orNull(v.dimensions),
          weight: orNull(v.weight),
          featured: v.featured,
          seoTitle: orNull(v.seoTitle),
          seoDescription: orNull(v.seoDescription),
        },
        id,
      );
      await saveVariants(
        productId,
        v.variants.map((x) => ({
          id: x.id,
          name: x.name,
          sku: x.sku,
          price: x.price ? Number(x.price) : null,
          inventoryQuantity: Number(x.inventoryQuantity),
        })),
        product?.variants.map((x) => x.id) ?? [],
      );
      if (isNew) {
        toast.success('Product created', 'Now add images below.');
        navigate(`/admin/products/${productId}/edit`, { replace: true });
      } else {
        toast.success('Product saved');
        formSynced.current = false;
        productState.reload();
      }
    } catch (e) {
      setServerError(friendlyError(e));
    }
  };

  return (
    <>
      <AdminPageHeader
        title={isNew ? 'New product' : `Edit: ${product?.name}`}
        description={isNew ? 'Create a product, then upload images.' : `SKU ${product?.sku}`}
        actions={
          <div className="flex gap-2">
            {product?.status === 'active' && (
              <Link to={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> View on store
              </Link>
            )}
            <Link to="/admin/products" className="btn-ghost">Back to products</Link>
          </div>
        }
      />

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card grid gap-4 p-6 sm:grid-cols-2">
            <h2 className="text-lg font-semibold sm:col-span-2">Basics</h2>
            <Field label="Name" error={errors.name?.message} required className="sm:col-span-2">
              <input className="input" {...register('name')} />
            </Field>
            <Field label="Slug (URL)" error={errors.slug?.message} hint={`/product/${watch('slug') || '…'}`} required>
              <input className="input" {...register('slug', { onChange: () => setSlugTouched(true) })} />
            </Field>
            <Field label="SKU" error={errors.sku?.message} required>
              <input className="input" {...register('sku')} />
            </Field>
            <Field label="Short description" error={errors.shortDescription?.message} required className="sm:col-span-2">
              <textarea className="input min-h-20" {...register('shortDescription')} />
            </Field>
            <Field label="Full description" error={errors.fullDescription?.message} required className="sm:col-span-2">
              <textarea className="input min-h-40" {...register('fullDescription')} />
            </Field>
          </section>

          <section className="card grid gap-4 p-6 sm:grid-cols-3">
            <h2 className="text-lg font-semibold sm:col-span-3">Pricing & inventory</h2>
            <Field label="Regular price" error={errors.regularPrice?.message} required>
              <input inputMode="decimal" className="input" {...register('regularPrice')} />
            </Field>
            <Field label="Sale price" error={errors.salePrice?.message} hint="Leave blank when not on sale">
              <input inputMode="decimal" className="input" {...register('salePrice')} />
            </Field>
            <Field label="Currency" error={errors.currency?.message} required>
              <input className="input uppercase" maxLength={3} {...register('currency')} />
            </Field>
            <Field
              label="Inventory quantity"
              error={errors.inventoryQuantity?.message}
              hint={hasVariants ? 'Calculated from variant stock' : undefined}
              required
            >
              <input inputMode="numeric" className="input" disabled={hasVariants} {...register('inventoryQuantity')} />
            </Field>
          </section>

          <section className="card space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Editions / variants</h2>
                <p className="text-xs text-ink-400">Optional. When variants exist, customers must choose one and stock is tracked per variant.</p>
              </div>
              <button
                type="button"
                className="btn-secondary px-3 py-2"
                onClick={() => variants.append({ name: '', sku: `${watch('sku') || 'SKU'}-${variants.fields.length + 1}`, price: '', inventoryQuantity: '0' })}
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Add variant
              </button>
            </div>
            {variants.fields.map((f, i) => (
              <div key={f.id} className="grid gap-3 rounded-xl border border-ink-700 p-4 sm:grid-cols-[1.4fr_1fr_0.8fr_0.7fr_auto]">
                <Field label="Name" error={errors.variants?.[i]?.name?.message}>
                  <input className="input" {...register(`variants.${i}.name`)} />
                </Field>
                <Field label="SKU" error={errors.variants?.[i]?.sku?.message}>
                  <input className="input" {...register(`variants.${i}.sku`)} />
                </Field>
                <Field label="Price" error={errors.variants?.[i]?.price?.message} hint="Blank = product price">
                  <input inputMode="decimal" className="input" {...register(`variants.${i}.price`)} />
                </Field>
                <Field label="Stock" error={errors.variants?.[i]?.inventoryQuantity?.message}>
                  <input inputMode="numeric" className="input" {...register(`variants.${i}.inventoryQuantity`)} />
                </Field>
                <button type="button" className="icon-btn mt-7 hover:text-rose-300" onClick={() => variants.remove(i)} aria-label={`Remove variant ${i + 1}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </section>

          <section className="card grid gap-4 p-6 sm:grid-cols-2">
            <h2 className="text-lg font-semibold sm:col-span-2">Specifications</h2>
            <Field label="Anime / series" error={errors.franchise?.message} hint="Pick a series so the product appears on that series page">
              <input className="input" list="series-options" {...register('franchise')} />
            </Field>
            <datalist id="series-options">
              {series.map((s) => (
                <option key={s.slug} value={s.name} />
              ))}
            </datalist>
            <Field label="Scale" error={errors.scale?.message}>
              <input className="input" placeholder="1/7" {...register('scale')} />
            </Field>
            <Field label="Material" error={errors.material?.message}>
              <input className="input" placeholder="PVC, ABS" {...register('material')} />
            </Field>
            <Field label="Dimensions" error={errors.dimensions?.message}>
              <input className="input" placeholder="H 25 cm × W 18 cm × D 16 cm" {...register('dimensions')} />
            </Field>
            <Field label="Weight" error={errors.weight?.message}>
              <input className="input" placeholder="0.9 kg" {...register('weight')} />
            </Field>
            <Field label="Release date" error={errors.releaseDate?.message}>
              <input type="date" className="input" {...register('releaseDate')} />
            </Field>
          </section>

          <section className="card grid gap-4 p-6">
            <h2 className="text-lg font-semibold">SEO</h2>
            <Field label="SEO title" error={errors.seoTitle?.message} hint="Defaults to the product name">
              <input className="input" {...register('seoTitle')} />
            </Field>
            <Field label="SEO description" error={errors.seoDescription?.message} hint="Defaults to the short description">
              <textarea className="input min-h-20" {...register('seoDescription')} />
            </Field>
          </section>

          {!isNew && product && (
            <section className="card space-y-4 p-6">
              <h2 className="text-lg font-semibold">Images</h2>
              <ProductImagesManager productId={product.id} productName={product.name} images={product.images} onChange={productState.reload} />
            </section>
          )}
          {isNew && <p className="text-sm text-ink-400">Save the product to start uploading images.</p>}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
          <section className="card space-y-4 p-6">
            <h2 className="text-lg font-semibold">Publishing</h2>
            <Field label="Status" error={errors.status?.message}>
              <select className="input" {...register('status')}>
                <option value="draft">Draft (hidden)</option>
                <option value="active">Active (visible)</option>
                <option value="archived">Archived (hidden)</option>
              </select>
            </Field>
            <Field label="Badge" error={errors.badge?.message}>
              <select className="input" {...register('badge')}>
                <option value="">None</option>
                <option value="new">New</option>
                <option value="sale">Sale</option>
                <option value="preorder">Preorder</option>
                <option value="limited">Limited</option>
                <option value="sold_out">Sold out</option>
              </select>
            </Field>
            <label className="flex items-center gap-2.5 text-sm text-ink-300">
              <input type="checkbox" className="h-4 w-4 accent-nova-500" {...register('featured')} /> Featured on home page
            </label>
          </section>
          <section className="card space-y-4 p-6">
            <h2 className="text-lg font-semibold">Organization</h2>
            <Field label="Category" error={errors.categoryId?.message}>
              <select className="input" {...register('categoryId')}>
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.isActive ? '' : ' (inactive)'}</option>
                ))}
              </select>
            </Field>
            <Field label="Brand" error={errors.brandId?.message}>
              <select className="input" {...register('brandId')}>
                <option value="">No brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
          </section>
          <FormAlert message={serverError} />
          <button type="submit" className="btn-primary w-full py-3" disabled={isSubmitting || (!isNew && !isDirty)}>
            {isSubmitting ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
          </button>
        </aside>
      </form>
    </>
  );
}
