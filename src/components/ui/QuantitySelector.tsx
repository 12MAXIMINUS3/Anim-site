import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  label?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function QuantitySelector({ value, onChange, min = 1, max, label = 'Quantity', size = 'md', disabled }: Props) {
  const h = size === 'sm' ? 'h-8' : 'h-11';
  const clamp = (n: number) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
  return (
    <div className={cn('inline-flex items-center rounded-xl border border-ink-600 bg-ink-850', h)} role="group" aria-label={label}>
      <button
        type="button"
        className={cn('flex items-center justify-center px-2.5 text-ink-300 hover:text-white disabled:opacity-40', h)}
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className="w-10 bg-transparent text-center text-sm font-semibold text-white [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
      />
      <button
        type="button"
        className={cn('flex items-center justify-center px-2.5 text-ink-300 hover:text-white disabled:opacity-40', h)}
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
