import { Suspense, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, FolderTree, LayoutDashboard, Menu, Package, Settings, ShoppingCart, Tags, Users, X } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { Spinner } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { useSeo } from '@/lib/seo';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/brands', label: 'Brands', icon: Tags },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  useSeo({ title: 'Admin', noIndex: true });
  const { profile, user } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const nav = (
    <nav aria-label="Admin" className="space-y-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isActive ? 'bg-nova-500/15 text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white',
            )
          }
        >
          <Icon className="h-4 w-4" aria-hidden="true" /> {label}
        </NavLink>
      ))}
      <Link to="/" className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to store
      </Link>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-nova-600 focus:px-4 focus:py-2">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-800 bg-ink-900/60 p-5 lg:flex">
        <Logo className="mb-8" />
        {nav}
        <p className="mt-auto truncate text-xs text-ink-500">Signed in as {profile?.fullName || user?.email}</p>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-ink-800 bg-ink-900 p-5">
            <div className="mb-8 flex items-center justify-between">
              <Logo />
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close admin menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-ink-800 bg-ink-950/90 px-4 backdrop-blur lg:hidden">
          <button type="button" className="icon-btn" onClick={() => setOpen(true)} aria-label="Open admin menu" aria-expanded={open}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold">Admin</span>
        </header>
        <main id="admin-main" className="p-4 sm:p-6 lg:p-10" tabIndex={-1}>
          <Suspense key={location.pathname} fallback={<Spinner className="py-24" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-400">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
