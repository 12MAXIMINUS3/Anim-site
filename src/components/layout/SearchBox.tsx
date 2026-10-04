import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Loader2, Search } from 'lucide-react';
import { catalog } from '@/services/catalog';
import type { QuickSearchResult } from '@/services/catalogTypes';
import { useDebounce } from '@/hooks/useDebounce';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Option {
  key: string;
  href: string;
  label: string;
}

/** Debounced product/category search combobox with keyboard navigation. */
export function SearchBox({ autoFocus, onNavigate, className }: { autoFocus?: boolean; onNavigate?: () => void; className?: string }) {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QuickSearchResult>({ products: [], categories: [] });
  const [active, setActive] = useState(-1);
  const debounced = useDebounce(term.trim(), 300);
  const navigate = useNavigate();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults({ products: [], categories: [] });
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    catalog
      .quickSearch(debounced)
      .then((r) => {
        if (!cancelled) {
          setResults(r);
          setActive(-1);
        }
      })
      .catch(() => {
        if (!cancelled) setResults({ products: [], categories: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const options: Option[] = [
    ...results.categories.map((c) => ({ key: `c-${c.id}`, href: `/category/${c.slug}`, label: c.name })),
    ...results.products.map((p) => ({ key: `p-${p.id}`, href: `/product/${p.slug}`, label: p.name })),
  ];

  const go = (href: string) => {
    setOpen(false);
    setTerm('');
    onNavigate?.();
    navigate(href);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (active >= 0 && options[active]) return go(options[active].href);
    if (term.trim()) go(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  const showPanel = open && debounced.length >= 2;
  const optionId = (i: number) => `${listId}-opt-${i}`;

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <form role="search" onSubmit={submit}>
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search products and categories
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
        <input
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          autoFocus={autoFocus}
          autoComplete="off"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search figures, brands, series…"
          className="input rounded-full bg-ink-850/80 pl-10 pr-10"
        />
        {loading && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-nova-400" aria-hidden="true" />}
      </form>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl">
          <ul id={listId} role="listbox" aria-label="Search suggestions" className="max-h-[70vh] overflow-y-auto py-2">
            {results.categories.map((c, i) => (
              <li
                key={c.id}
                id={optionId(i)}
                role="option"
                aria-selected={active === i}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(`/category/${c.slug}`)}
                className={cn('flex cursor-pointer items-center gap-3 px-4 py-2 text-sm', active === i ? 'bg-nova-500/15' : 'hover:bg-ink-800')}
              >
                <FolderOpen className="h-4 w-4 text-pulse-400" aria-hidden="true" />
                <span>
                  <span className="text-white">{c.name}</span> <span className="text-xs text-ink-400">· Category</span>
                </span>
              </li>
            ))}
            {results.products.map((p, j) => {
              const i = results.categories.length + j;
              return (
                <li
                  key={p.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={active === i}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(`/product/${p.slug}`)}
                  className={cn('flex cursor-pointer items-center gap-3 px-4 py-2', active === i ? 'bg-nova-500/15' : 'hover:bg-ink-800')}
                >
                  <ImageWithFallback src={p.images[0]?.url} alt="" className="h-12 w-10 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-white">{p.name}</span>
                    <span className="block text-xs text-ink-400">{p.brand?.name}</span>
                  </span>
                  <span className="text-sm font-semibold text-white">{formatCurrency(p.price, p.currency)}</span>
                </li>
              );
            })}
            {!loading && options.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-400">No matches for “{debounced}”.</li>}
          </ul>
          <button
            type="button"
            onClick={() => go(`/search?q=${encodeURIComponent(debounced)}`)}
            className="block w-full border-t border-ink-800 px-4 py-3 text-left text-sm font-semibold text-nova-300 hover:bg-ink-800"
          >
            See all results for “{debounced}” →
          </button>
        </div>
      )}
    </div>
  );
}
