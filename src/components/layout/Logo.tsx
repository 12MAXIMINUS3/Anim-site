import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { useSettings } from '@/context/SettingsContext';

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  const { images } = useSettings();
  if (images.logo) {
    return (
      <Link to="/" onClick={onClick} className={cn('flex min-w-0 items-center', className)} aria-label="Figure Haven — home">
        <img src={images.logo} alt="Figure Haven" className="h-12 w-auto max-w-[170px] object-contain sm:h-14" />
      </Link>
    );
  }
  return (
    <Link to="/" onClick={onClick} className={cn('group flex min-w-0 items-center gap-2 sm:gap-2.5', className)} aria-label="Figure Haven — home">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nova-500 to-pulse-400 font-display text-lg font-extrabold text-ink-950 shadow-glow transition group-hover:rotate-6">
        F
      </span>
      <span className="truncate font-display leading-none">
        <span className="block text-[15px] font-extrabold tracking-tight text-white">Figure</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.35em] text-pulse-400">Haven</span>
      </span>
    </Link>
  );
}
