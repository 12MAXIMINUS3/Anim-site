import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} className={cn('group flex min-w-0 items-center gap-2 sm:gap-2.5', className)} aria-label="Nova Figure Vault — home">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nova-500 to-pulse-400 font-display text-lg font-extrabold text-ink-950 shadow-glow transition group-hover:rotate-6">
        N
      </span>
      <span className="truncate font-display leading-none">
        <span className="block text-[15px] font-extrabold tracking-tight text-white">Nova Figure</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.35em] text-pulse-400">Vault</span>
      </span>
    </Link>
  );
}
