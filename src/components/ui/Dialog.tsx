import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { cn } from '@/lib/cn';

type Variant = 'center' | 'right' | 'left';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Visually hide the title (still announced to screen readers). */
  hideTitle?: boolean;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
}

const sizeClass = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' };

/** Accessible modal dialog / side drawer with focus trap and Escape-to-close. */
export function Dialog({ open, onClose, title, hideTitle, variant = 'center', size = 'md', children, footer }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref, open, onClose);

  if (!open) return null;

  const panel =
    variant === 'center'
      ? cn('relative m-auto flex max-h-[92vh] w-[calc(100%-2rem)] flex-col rounded-2xl', sizeClass[size])
      : cn(
          'fixed inset-y-0 flex w-full max-w-md flex-col',
          variant === 'right' ? 'right-0 border-l' : 'left-0 border-r',
        );

  return createPortal(
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(panel, 'animate-slide-up border-ink-700 bg-ink-900 shadow-2xl outline-none', variant === 'center' && 'border')}
      >
        <div className={cn('flex items-center justify-between gap-4 px-5 py-4', !hideTitle && 'border-b border-ink-800')}>
          <h2 id={titleId} className={cn('text-lg font-semibold', hideTitle && 'sr-only')}>
            {title}
          </h2>
          <button type="button" onClick={onClose} className="icon-btn ml-auto" aria-label="Close dialog">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-ink-800 px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
