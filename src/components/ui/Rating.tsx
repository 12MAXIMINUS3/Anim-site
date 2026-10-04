import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Rating({ value, count, size = 'sm', className }: { value: number; count?: number; size?: 'sm' | 'md'; className?: string }) {
  const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5{count !== undefined ? ` from ${count} reviews` : ''}
      </span>
      <div className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
          return (
            <span key={i} className={cn('relative', px)}>
              <Star className={cn(px, 'text-ink-600')} />
              {fill > 0 && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star className={cn(px, 'fill-amber-300 text-amber-300')} />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {count !== undefined && (
        <span className="text-xs text-ink-400" aria-hidden="true">
          ({count})
        </span>
      )}
    </div>
  );
}
