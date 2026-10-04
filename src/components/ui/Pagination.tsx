import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  page: number;
  pageCount: number;
  /** Builds the href for a given page number. */
  hrefFor: (page: number) => string;
}

function pageWindow(page: number, count: number): Array<number | 'gap'> {
  const pages = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | 'gap'> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

export function Pagination({ page, pageCount, hrefFor }: Props) {
  if (pageCount <= 1) return null;
  const linkCls = 'flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition';
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link to={hrefFor(page - 1)} className={cn(linkCls, 'border-ink-700 hover:border-nova-400')} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(linkCls, 'border-ink-800 text-ink-600')} aria-hidden="true">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}
      {pageWindow(page, pageCount).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-ink-500" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={p}
            to={hrefFor(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              linkCls,
              p === page ? 'border-nova-500 bg-nova-500/15 text-white' : 'border-ink-700 text-ink-300 hover:border-nova-400 hover:text-white',
            )}
          >
            <span className="sr-only">Page </span>
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link to={hrefFor(page + 1)} className={cn(linkCls, 'border-ink-700 hover:border-nova-400')} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(linkCls, 'border-ink-800 text-ink-600')} aria-hidden="true">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
