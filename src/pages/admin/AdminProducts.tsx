import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Save, Search, Trash2 } from 'lucide-react';
import type { Product, ProductStatus } from '@/types';
import { adminListCategories, adminListProducts, deleteProduct, updateInventory } from '@/services/admin';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/lib/format';
import { friendlyError } from '@/lib/authErrors';
import { toast } from '@/store/toastStore';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States';
import { AdminPageHeader } from './AdminLayout';
import { cn } from '@/lib/cn';

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<ProductStatus, string> = {
  active: 'bg-emerald-400/15 text-emerald-200',
  draft: 'bg-ink-700 text-ink-200',
  archived: 'bg-rose-500/15 text-rose-200',
};

function StockCell({ product, onSaved }: { product: Product; onSaved: () => void }) {
  const [value, setValue] = useState(String(product.inventoryQuantity));
  const [saving, setSaving] = useState(false);
  const hasVariants = product.variants.length > 0;
  const dirty = Number(value) !== product.inventoryQuantity;

  if (hasVariants) {
    return (
      <span className="text-sm" title="Stock is the sum of variant stock — edit variants in the product editor">
        {product.inventoryQuantity} <span className="text-xs text-ink-500">(variants)</span>
      </span>
    );
  }
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={async (e) => {
        e.preventDefault();
        const qty = Math.max(0, Math.floor(Number(value)));
        if (!Number.isFinite(qty)) return;
        setSaving(true);
        try {
          await updateInventory(product.id, qty);
          toast.success('Stock updated', `${product.name}: ${qty}`);
          onSaved();
        } catch (err) {
          toast.error('Could not update stock', friendlyError(err));
        } finally {
          setSaving(false);
        }
      }}
    >
      <label className="sr-only" htmlFor={`stock-${product.id}`}>Stock for {product.name}</label>
      <input
        id={`stock-${product.id}`}
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={cn('input w-20 px-2 py-1.5', product.inventoryQuantity <= 5 && 'border-amber-500/60')}
      />
      {dirty && (
        <button type="submit" className="icon-btn h-8 w-8 text-pulse-300" disabled={saving} aria-label={`Save stock for ${product.name}`}>
          <Save className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}

export default function AdminProducts() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const debounced = useDebounce(search, 350);
  const status = (params.get('status') ?? '') as ProductStatus | '';
  const categoryId = params.get('category') ?? '';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const categories = useAsync(adminListCategories, []);
  const list = useAsync(
    () => adminListProducts({ search: debounced, status, categoryId, page, pageSize: PAGE_SIZE }),
    [debounced, status, categoryId, page],
  );

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  };

  const pageCount = Math.max(1, Math.ceil((list.data?.total ?? 0) / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={list.data ? `${list.data.total} products` : undefined}
        actions={
          <Link to="/admin/products/new" className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" /> New product
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_180px_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <label htmlFor="admin-product-search" className="sr-only">Search products</label>
          <input
            id="admin-product-search"
            className="input pl-9"
            placeholder="Search name, SKU or franchise"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (page !== 1) setParam('page', '');
            }}
          />
        </div>
        <label className="sr-only" htmlFor="admin-status">Status</label>
        <select id="admin-status" className="input" value={status} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <label className="sr-only" htmlFor="admin-category">Category</label>
        <select id="admin-category" className="input" value={categoryId} onChange={(e) => setParam('category', e.target.value)}>
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : list.loading && !list.data ? (
        <Spinner />
      ) : !list.data?.items.length ? (
        <EmptyState title="No products found" description="Adjust the filters or create a new product." />
      ) : (
        <div className={cn('card overflow-x-auto', list.loading && 'opacity-60')}>
          <table className="table-admin min-w-[860px]">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">SKU</th>
                <th scope="col">Price</th>
                <th scope="col">Stock</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <ImageWithFallback src={p.images[0]?.url} alt="" className="h-12 w-10 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <Link to={`/admin/products/${p.id}/edit`} className="line-clamp-1 font-medium text-white hover:text-nova-200">{p.name}</Link>
                        <p className="text-xs text-ink-500">{p.category?.name ?? 'Uncategorized'} · {p.brand?.name ?? 'No brand'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-ink-300">{p.sku}</td>
                  <td>
                    <span className="text-white">{formatCurrency(p.price, p.currency)}</span>
                    {p.salePrice !== null && <s className="ml-1 text-xs text-ink-500">{formatCurrency(p.regularPrice, p.currency)}</s>}
                  </td>
                  <td><StockCell key={`${p.id}-${p.inventoryQuantity}`} product={p} onSaved={list.reload} /></td>
                  <td><span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold capitalize', STATUS_STYLES[p.status])}>{p.status}</span></td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/products/${p.id}/edit`} className="icon-btn h-8 w-8" aria-label={`Edit ${p.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        className="icon-btn h-8 w-8 hover:text-rose-300"
                        aria-label={`Delete ${p.name}`}
                        onClick={async () => {
                          if (!window.confirm(`Delete “${p.name}”? This also removes its images. This cannot be undone.`)) return;
                          try {
                            await deleteProduct(p);
                            toast.success('Product deleted');
                            list.reload();
                          } catch (e) {
                            toast.error('Could not delete product', friendlyError(e));
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        pageCount={pageCount}
        hrefFor={(n) => {
          const next = new URLSearchParams(params);
          if (n > 1) next.set('page', String(n));
          else next.delete('page');
          const s = next.toString();
          return `/admin/products${s ? `?${s}` : ''}`;
        }}
      />
    </>
  );
}
