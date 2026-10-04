import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-400">
        <li>
          <Link to="/" className="hover:text-white">
            Home
          </Link>
        </li>
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            {c.to && i < items.length - 1 ? (
              <Link to={c.to} className="hover:text-white">
                {c.label}
              </Link>
            ) : (
              <span aria-current={i === items.length - 1 ? 'page' : undefined} className="text-ink-200">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({ title, description, crumbs, children }: { title: string; description?: ReactNode; crumbs?: Crumb[]; children?: ReactNode }) {
  return (
    <div className="border-b border-ink-800 bg-gradient-to-b from-ink-900/60 to-transparent">
      <div className="container-page py-10 sm:py-12">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {description && <div className="mt-3 max-w-2xl text-ink-300">{description}</div>}
        {children}
      </div>
    </div>
  );
}
