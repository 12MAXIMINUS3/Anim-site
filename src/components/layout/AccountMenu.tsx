import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Package, User, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/store/toastStore';
import { friendlyError } from '@/lib/authErrors';

export function AccountMenu() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link to="/login" className="icon-btn" aria-label="Sign in">
        <User className="h-5 w-5" />
      </Link>
    );
  }

  const items = [
    { to: '/account', label: 'My account', icon: UserCircle2 },
    { to: '/account?tab=orders', label: 'Orders', icon: Package },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin dashboard', icon: LayoutDashboard }] : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
      >
        <UserCircle2 className="h-5 w-5 text-nova-300" />
      </button>
      {open && (
        <div id={menuId} role="menu" className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 py-2 shadow-2xl">
          <p className="truncate px-4 pb-2 text-xs text-ink-400">
            Signed in as <span className="text-ink-200">{profile?.fullName || user.email}</span>
          </p>
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-ink-200 hover:bg-ink-800 hover:text-white">
              <Icon className="h-4 w-4" aria-hidden="true" /> {label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-ink-200 hover:bg-ink-800 hover:text-white"
            onClick={async () => {
              setOpen(false);
              try {
                await signOut();
                toast.info('Signed out', 'See you soon, collector.');
                navigate('/');
              } catch (e) {
                toast.error('Sign out failed', friendlyError(e));
              }
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
