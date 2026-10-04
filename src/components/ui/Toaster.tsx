import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';
import { cn } from '@/lib/cn';

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />,
  error: <XCircle className="h-5 w-5 text-rose-400" aria-hidden="true" />,
  info: <Info className="h-5 w-5 text-pulse-400" aria-hidden="true" />,
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:items-end"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-2xl border bg-ink-900/95 p-4 shadow-2xl backdrop-blur',
            t.tone === 'error' ? 'border-rose-500/40' : 'border-ink-700',
          )}
        >
          {icons[t.tone]}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">{t.title}</p>
            {t.description && <p className="mt-0.5 line-clamp-2 text-xs text-ink-300">{t.description}</p>}
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
                className="mt-2 text-xs font-semibold text-nova-300 hover:text-pulse-300"
              >
                {t.action.label}
              </button>
            )}
          </div>
          <button type="button" onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-white" aria-label="Dismiss notification">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
