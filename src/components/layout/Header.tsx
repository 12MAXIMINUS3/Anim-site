import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { Logo } from './Logo';
import { SearchBox } from './SearchBox';
import { AccountMenu } from './AccountMenu';
import { MobileNav } from './MobileNav';
import { useUiStore } from '@/store/uiStore';
import { selectCartCount, useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { cn } from '@/lib/cn';
import { ANIME_SERIES, seriesHref } from '@/data/series';

interface MenuItem {
  to: string;
  title: string;
  subtitle?: string | null;
}

/** Hover/click dropdown used for the Anime and Collections menus. */
function NavDropdown({ label, items, footer }: { label: string; items: MenuItem[]; footer?: MenuItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        className="flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-200 hover:text-white"
      >
        {label} <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 pt-2">
          <div className="w-[520px] rounded-2xl border border-ink-700 bg-ink-900 p-3 shadow-2xl">
            <ul className="grid grid-cols-2 gap-1">
              {items.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="block rounded-xl px-3 py-2.5 hover:bg-ink-800">
                    <span className="block text-sm font-semibold text-white">{item.title}</span>
                    {item.subtitle && <span className="line-clamp-1 text-xs text-ink-400">{item.subtitle}</span>}
                  </Link>
                </li>
              ))}
            </ul>
            {footer && (
              <Link to={footer.to} className="mt-2 block border-t border-ink-800 px-3 pt-3 text-sm font-semibold text-nova-300 hover:text-pulse-300">
                {footer.title} →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** "Shop" menu: all products plus every anime series. */
function ShopMenu() {
  return (
    <NavDropdown
      label="Shop"
      items={ANIME_SERIES.map((s) => ({ to: seriesHref(s), title: s.name }))}
      footer={{ to: '/shop', title: 'Shop all products' }}
    />
  );
}

export function Header() {
  const openCart = useUiStore((s) => s.openCart);
  const setMobileNav = useUiStore((s) => s.setMobileNav);
  const cartCount = useCartStore(selectCartCount);
  const wishCount = useWishlistStore((s) => s.ids.length);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileSearch(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navCls = ({ isActive }: { isActive: boolean }) =>
    cn('whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition', isActive ? 'text-white' : 'text-ink-200 hover:text-white');

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b transition-colors',
        scrolled ? 'border-ink-800 bg-ink-950/85 backdrop-blur-xl' : 'border-transparent bg-ink-950/60 backdrop-blur',
      )}
    >
      <div className="container-page flex h-16 items-center gap-3 lg:h-20">
        <button type="button" className="icon-btn -ml-2 shrink-0 lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <Logo />

        <nav aria-label="Primary" className="ml-4 hidden items-center lg:flex xl:ml-8">
          <NavLink to="/" end className={navCls}>
            Home
          </NavLink>
          <ShopMenu />
          <NavLink to="/about" className={navCls}>
            About
          </NavLink>
          <NavLink to="/contact" className={navCls}>
            Contact
          </NavLink>
        </nav>

        <SearchBox className="ml-auto hidden w-full max-w-xs md:block lg:hidden xl:block xl:max-w-sm" />

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 md:ml-2">
          <button type="button" className="icon-btn md:hidden lg:inline-flex xl:hidden" onClick={() => setMobileSearch((v) => !v)} aria-label={mobileSearch ? 'Close search' : 'Open search'} aria-expanded={mobileSearch}>
            {mobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
          {/* On phones the account links live in the slide-out menu. */}
          <div className="hidden sm:block">
            <AccountMenu />
          </div>
          <Link to="/wishlist" className="icon-btn relative" aria-label={`Wishlist, ${wishCount} item${wishCount === 1 ? '' : 's'}`}>
            <Heart className="h-5 w-5" />
            {wishCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white" aria-hidden="true">
                {wishCount}
              </span>
            )}
          </Link>
          <button type="button" onClick={openCart} className="icon-btn relative" aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}>
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pulse-400 px-1 text-[10px] font-bold text-ink-950" aria-hidden="true">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
      {mobileSearch && (
        <div className="container-page pb-3 md:hidden lg:block xl:hidden">
          <SearchBox autoFocus onNavigate={() => setMobileSearch(false)} />
        </div>
      )}
      <MobileNav />
    </header>
  );
}
