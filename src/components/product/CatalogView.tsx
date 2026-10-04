import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Columns2, Columns3, Columns4, SlidersHorizontal, X } from 'lucide-react';
import { catalog, makeQuery, DEFAULT_PAGE_SIZE } from '@/services/catalog';
import { useAsync } from '@/hooks/useAsync';
import { countActiveFilters, parseCatalogParams, SORT_OPTIONS } from '@/lib/catalogParams';
import { readJson, writeJson } from '@/lib/storage';
import { ProductGrid, type GridColumns } from './ProductGrid';
import { FilterPanel } from './FilterPanel';
import { Pagination } from '@/components/ui/Pagination';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { cn } from '@/lib/cn';

interface Props {
  /** Base path for page 1, e.g. "/shop", "/category/statues", "/search". */
  basePath: string;
  /** "path" → /shop/page/2 ; "query" → ?page=2 */
  pageMode: 'path' | 'query';
  page: number;
  fixedCategorySlug?: string;
}

export function CatalogView({ basePath, pageMode, page, fixedCategorySlug }: Props) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columns, setColumns] = useState<GridColumns>(() => readJson<GridColumns>('nfv-grid', 4));

  const filters = useMemo(() => parseCatalogParams(params), [params]);
  const query = useMemo(
    () =>
      makeQuery({
        ...filters,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        categories: fixedCategorySlug ? [fixedCategorySlug] : filters.categories,
      }),
    [filters, page, fixedCategorySlug],
  );

  const result = useAsync(() => catalog.queryProducts(query), [JSON.stringify(query)]);
  const taxonomy = useAsync(() => Promise.all([catalog.listCategories(), catalog.listBrands(), catalog.getFacets()]), []);
  const [categories, brands, facets] = taxonomy.data ?? [[], [], undefined];

  const withoutPage = (p: URLSearchParams) => {
    const next = new URLSearchParams(p);
    next.delete('page');
    return next;
  };

  const hrefFor = (n: number) => {
    const qs = withoutPage(params);
    if (pageMode === 'query') {
      if (n > 1) qs.set('page', String(n));
      const s = qs.toString();
      return `${basePath}${s ? `?${s}` : ''}`;
    }
    const s = qs.toString();
    return `${n > 1 ? `${basePath}/page/${n}` : basePath}${s ? `?${s}` : ''}`;
  };

  const applyParams = (next: URLSearchParams) => {
    const s = withoutPage(next).toString();
    navigate(`${basePath}${s ? `?${s}` : ''}`, { replace: false });
  };

  const setSort = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === 'featured') next.delete('sort');
    else next.set('sort', value);
    applyParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    const q = params.get('q');
    if (q) next.set('q', q);
    const sort = params.get('sort');
    if (sort) next.set('sort', sort);
    applyParams(next);
  };

  const setGrid = (c: GridColumns) => {
    setColumns(c);
    writeJson('nfv-grid', c);
  };

  const activeCount = countActiveFilters(params, Boolean(fixedCategorySlug));
  const data = result.data;
  const start = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const end = data ? Math.min(data.total, data.page * data.pageSize) : 0;

  const panel = (
    <FilterPanel
      params={params}
      onChange={(next) => {
        applyParams(next);
      }}
      categories={categories}
      brands={brands}
      facets={facets}
      hideCategory={Boolean(fixedCategorySlug)}
    />
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block" aria-label="Product filters">
        <div className="sticky top-28">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-300">Filters</h2>
            {activeCount > 0 && (
              <button type="button" onClick={clearFilters} className="text-xs font-semibold text-nova-300 hover:text-pulse-300">
                Clear all ({activeCount})
              </button>
            )}
          </div>
          {panel}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-800 bg-ink-900/60 px-4 py-3">
          <p className="text-sm text-ink-300" aria-live="polite">
            {result.loading ? 'Loading products…' : data ? (data.total > 0 ? `Showing ${start}–${end} of ${data.total} products` : '0 products') : ''}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary px-3 py-2 lg:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters{activeCount > 0 ? ` (${activeCount})` : ''}
            </button>
            <label htmlFor="sort" className="sr-only">
              Sort products
            </label>
            <select id="sort" className="input w-auto py-2 pr-8" value={filters.sort === 'best_selling' ? 'featured' : filters.sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="hidden items-center gap-1 rounded-xl border border-ink-700 p-1 lg:flex" role="group" aria-label="Grid columns">
              {([2, 3, 4] as GridColumns[]).map((c) => {
                const Icon = c === 2 ? Columns2 : c === 3 ? Columns3 : Columns4;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setGrid(c)}
                    aria-pressed={columns === c}
                    aria-label={`${c} products per row`}
                    className={cn('rounded-lg p-1.5', columns === c ? 'bg-nova-500/20 text-white' : 'text-ink-400 hover:text-white')}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {activeCount > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {(['category', 'brand', 'franchise', 'scale'] as const).flatMap((key) =>
              key === 'category' && fixedCategorySlug
                ? []
                : params.getAll(key).map((v) => (
                    <button
                      key={`${key}-${v}`}
                      type="button"
                      className="chip hover:border-nova-400"
                      onClick={() => {
                        const next = new URLSearchParams(params);
                        const rest = next.getAll(key).filter((x) => x !== v);
                        next.delete(key);
                        rest.forEach((x) => next.append(key, x));
                        applyParams(next);
                      }}
                      aria-label={`Remove filter ${v}`}
                    >
                      {categories.find((c) => c.slug === v)?.name ?? brands.find((b) => b.slug === v)?.name ?? v}
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  )),
            )}
            <button type="button" onClick={clearFilters} className="chip border-transparent text-nova-300 hover:text-pulse-300">
              Clear all
            </button>
          </div>
        )}

        {result.error ? (
          <ErrorState title="Products could not be loaded" error={result.error} onRetry={result.reload} />
        ) : !result.loading && data && data.items.length === 0 ? (
          data.total > 0 ? (
            <EmptyState
              title="This page is empty"
              description={`There are only ${data.pageCount} page${data.pageCount === 1 ? '' : 's'} of results.`}
              action={
                <Link to={hrefFor(1)} className="btn-primary">
                  Go to page 1
                </Link>
              }
            />
          ) : activeCount === 1 && params.getAll('franchise').length === 1 && !params.get('q') ? (
            <EmptyState
              title={`${params.get('franchise')} figures are coming soon`}
              description="We're stocking this series now. Join the newsletter to hear when new figures land."
              action={
                <Link to="/shop" className="btn-primary">
                  Browse all figures
                </Link>
              }
            />
          ) : (
            <EmptyState
              title="No products match your filters"
              description="Try removing a filter or broadening your search."
              action={
                activeCount > 0 ? (
                  <button type="button" onClick={clearFilters} className="btn-primary">
                    Clear filters
                  </button>
                ) : (
                  <Link to="/shop" className="btn-primary">
                    Browse all products
                  </Link>
                )
              }
            />
          )
        ) : (
          <ProductGrid products={data?.items} loading={result.loading} columns={columns} skeletonCount={DEFAULT_PAGE_SIZE} />
        )}

        {data && <Pagination page={data.page} pageCount={data.pageCount} hrefFor={hrefFor} />}
      </div>

      <Dialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        variant="left"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary" onClick={clearFilters} disabled={activeCount === 0}>
              Clear all
            </button>
            <button type="button" className="btn-primary" onClick={() => setFiltersOpen(false)}>
              Show {data?.total ?? ''} results
            </button>
          </div>
        }
      >
        {panel}
      </Dialog>
    </div>
  );
}
