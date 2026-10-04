import type { ReactNode } from 'react';
import { AlertTriangle, Loader2, PackageOpen } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-ink-800', className)} aria-hidden="true">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

export function Spinner({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center justify-center gap-2 py-10 text-ink-300', className)}>
      <Loader2 className="h-5 w-5 animate-spin text-nova-400" aria-hidden="true" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-nova-500/10 text-nova-300">
        {icon ?? <PackageOpen className="h-7 w-7" aria-hidden="true" />}
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm text-ink-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', error, onRetry }: { title?: string; error?: Error | null; onRetry?: () => void }) {
  return (
    <div role="alert" className="card flex flex-col items-center border-rose-500/30 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-rose-400" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{title}</h2>
      {error && <p className="mt-2 max-w-md text-sm text-ink-400">{error.message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-6">
          Try again
        </button>
      )}
    </div>
  );
}
