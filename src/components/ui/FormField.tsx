import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FieldProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
  required?: boolean;
  /** A single input/select/textarea element; id and aria props are injected. */
  children: ReactElement;
}

/** Label + control + error message with correct ARIA wiring. */
export function Field({ label, error, hint, className, required, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })
    : children;
  return (
    <div className={cn(className)}>
      <label htmlFor={id} className="label">
        {label}
        {required && (
          <span className="text-rose-300" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {control}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormAlert({ message, tone = 'error' }: { message: string | null; tone?: 'error' | 'success' | 'info' }) {
  if (!message) return null;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-xl border px-4 py-3 text-sm',
        tone === 'error' && 'border-rose-500/40 bg-rose-500/10 text-rose-200',
        tone === 'success' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
        tone === 'info' && 'border-pulse-400/40 bg-pulse-400/10 text-pulse-200',
      )}
    >
      {message}
    </div>
  );
}
