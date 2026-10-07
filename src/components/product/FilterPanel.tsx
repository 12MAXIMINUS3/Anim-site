import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Brand, CatalogFacets, Category } from '@/types';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useSettings } from '@/context/SettingsContext';

interface Props {
  params: URLSearchParams;
  onChange: (next: URLSearchParams) => void;
  categories: Category[];
  brands: Brand[];
  facets: CatalogFacets | undefined;
  hideCategory?: boolean;
}

function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b border-ink-800 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 text-ink-400 transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-3 space-y-2">{children}</div>
    </details>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-300 hover:text-white">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-ink-500 bg-ink-850 accent-nova-500" />
      {label}
    </label>
  );
}

function Radio({ name, label, checked, onChange }: { name: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-300 hover:text-white">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="h-4 w-4 accent-nova-500" />
      {label}
    </label>
  );
}

export function FilterPanel({ params, onChange, categories, brands, facets, hideCategory }: Props) {
  const { series } = useSettings();
  const [min, setMin] = useState(params.get('min') ?? '');
  const [max, setMax] = useState(params.get('max') ?? '');
  useEffect(() => {
    setMin(params.get('min') ?? '');
    setMax(params.get('max') ?? '');
  }, [params]);

  const seriesNames = series.map((s) => s.name);
  // Only the store's anime series are browsable (see src/data/series.ts).
  const franchises = seriesNames;

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    next.delete('page');
    mutate(next);
    onChange(next);
  };

  const toggleMulti = (key: string, value: string) =>
    update((p) => {
      const values = p.getAll(key);
      p.delete(key);
      const nextValues = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
      nextValues.forEach((v) => p.append(key, v));
    });

  const setSingle = (key: string, value: string | null) =>
    update((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
    });

  const applyPrice = (e: FormEvent) => {
    e.preventDefault();
    update((p) => {
      if (min.trim()) p.set('min', String(Math.max(0, Number(min)))); else p.delete('min');
      if (max.trim()) p.set('max', String(Math.max(0, Number(max)))); else p.delete('max');
    });
  };

  return (
    <div>
      <Section title="Browse anime">
        <ul className="-mt-1 divide-y divide-ink-800">
          {[null, ...franchises].map((f) => {
            const active = f === null ? params.getAll('franchise').length === 0 : params.getAll('franchise').length === 1 && params.get('franchise') === f;
            return (
              <li key={f ?? 'all'}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSingle('franchise', f)}
                  className={cn(
                    'flex w-full items-center justify-between py-2.5 text-left text-[15px] transition',
                    active ? 'font-semibold text-white' : 'text-ink-300 hover:text-white',
                  )}
                >
                  {f ?? 'All anime'}
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-pulse-400" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      {!hideCategory && (
        <Section title="Product type" defaultOpen={false}>
          {categories.map((c) => (
            <Check key={c.id} label={c.name} checked={params.getAll('category').includes(c.slug)} onChange={() => toggleMulti('category', c.slug)} />
          ))}
        </Section>
      )}

      <Section title="Availability">
        <Radio name="availability" label="All" checked={!params.get('availability')} onChange={() => setSingle('availability', null)} />
        <Radio name="availability" label="In stock" checked={params.get('availability') === 'in_stock'} onChange={() => setSingle('availability', 'in_stock')} />
        <Radio name="availability" label="Sold out" checked={params.get('availability') === 'out_of_stock'} onChange={() => setSingle('availability', 'out_of_stock')} />
      </Section>

      <Section title="Preorder status">
        <Radio name="preorder" label="All products" checked={!params.get('preorder')} onChange={() => setSingle('preorder', null)} />
        <Radio name="preorder" label="Preorders only" checked={params.get('preorder') === 'only'} onChange={() => setSingle('preorder', 'only')} />
        <Radio name="preorder" label="Exclude preorders" checked={params.get('preorder') === 'exclude'} onChange={() => setSingle('preorder', 'exclude')} />
        <div className="pt-2">
          <Check label="On sale only" checked={params.get('sale') === '1'} onChange={() => setSingle('sale', params.get('sale') === '1' ? null : '1')} />
        </div>
      </Section>

      <Section title="Price">
        <form onSubmit={applyPrice} className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="price-min">Minimum price</label>
            <input id="price-min" type="number" min={0} inputMode="decimal" className="input py-2" placeholder={facets ? `${Math.floor(facets.minPrice)}` : 'Min'} value={min} onChange={(e) => setMin(e.target.value)} />
            <span className="text-ink-500" aria-hidden="true">–</span>
            <label className="sr-only" htmlFor="price-max">Maximum price</label>
            <input id="price-max" type="number" min={0} inputMode="decimal" className="input py-2" placeholder={facets ? `${Math.ceil(facets.maxPrice)}` : 'Max'} value={max} onChange={(e) => setMax(e.target.value)} />
          </div>
          {facets && (
            <p className="text-xs text-ink-400">
              Range: {formatCurrency(facets.minPrice)} – {formatCurrency(facets.maxPrice)}
            </p>
          )}
          <button type="submit" className="btn-secondary w-full py-2">
            Apply price
          </button>
        </form>
      </Section>

      <Section title="Brand">
        {brands.map((b) => (
          <Check key={b.id} label={b.name} checked={params.getAll('brand').includes(b.slug)} onChange={() => toggleMulti('brand', b.slug)} />
        ))}
      </Section>

      {facets && facets.scales.length > 0 && (
        <Section title="Scale" defaultOpen={false}>
          {facets.scales.map((s) => (
            <Check key={s} label={s} checked={params.getAll('scale').includes(s)} onChange={() => toggleMulti('scale', s)} />
          ))}
        </Section>
      )}
    </div>
  );
}
