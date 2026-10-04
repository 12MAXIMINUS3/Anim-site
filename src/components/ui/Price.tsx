import { formatCurrency, percentOff } from '@/lib/format';
import { cn } from '@/lib/cn';

interface PriceProps {
  amount: number;
  compareAt?: number | null;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercent?: boolean;
  className?: string;
}

export function Price({ amount, compareAt, currency = 'USD', size = 'md', showPercent, className }: PriceProps) {
  const onSale = compareAt != null && compareAt > amount;
  const main = { sm: 'text-sm', md: 'text-base', lg: 'text-3xl' }[size];
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
      <span className={cn('font-display font-bold', main, onSale ? 'text-rose-300' : 'text-white')}>
        {onSale && <span className="sr-only">Sale price </span>}
        {formatCurrency(amount, currency)}
      </span>
      {onSale && (
        <>
          <s className={cn('text-ink-400', size === 'lg' ? 'text-lg' : 'text-xs')}>
            <span className="sr-only">Regular price </span>
            {formatCurrency(compareAt!, currency)}
          </s>
          {showPercent && (
            <span className="rounded-md bg-rose-500/15 px-1.5 py-0.5 text-xs font-semibold text-rose-300">
              −{percentOff(compareAt!, amount)}%
            </span>
          )}
        </>
      )}
    </div>
  );
}
