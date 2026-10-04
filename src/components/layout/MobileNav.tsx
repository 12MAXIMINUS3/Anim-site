import { Link } from 'react-router-dom';
import { Dialog } from '@/components/ui/Dialog';
import { useUiStore } from '@/store/uiStore';
import { useAuth } from '@/context/AuthContext';
import { catalog } from '@/services/catalog';
import { useAsync } from '@/hooks/useAsync';
import { HELP_LINKS, PRIMARY_NAV } from './navigation';
import { ANIME_SERIES, seriesHref } from '@/data/series';

export function MobileNav() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNav);
  const { user, isAdmin } = useAuth();
  const { data: categories } = useAsync(() => catalog.listCategories(), []);
  const close = () => setOpen(false);
  const linkCls = 'block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-200 hover:bg-ink-800 hover:text-white';

  return (
    <Dialog open={open} onClose={close} title="Menu" variant="left">
      <nav aria-label="Mobile" className="space-y-6 pt-4">
        <ul>
          {PRIMARY_NAV.map((item) => (
            <li key={item.to}>
              <Link to={item.to} onClick={close} className={linkCls}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div>
          <p className="eyebrow px-3 pb-2">Anime</p>
          <ul>
            {ANIME_SERIES.map((s) => (
              <li key={s.slug}>
                <Link to={seriesHref(s)} onClick={close} className={linkCls}>
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow px-3 pb-2">Collections</p>
          <ul>
            {(categories ?? []).map((c) => (
              <li key={c.id}>
                <Link to={`/category/${c.slug}`} onClick={close} className={linkCls}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow px-3 pb-2">Account</p>
          <ul>
            {user ? (
              <>
                <li><Link to="/account" onClick={close} className={linkCls}>My account</Link></li>
                {isAdmin && <li><Link to="/admin" onClick={close} className={linkCls}>Admin dashboard</Link></li>}
              </>
            ) : (
              <>
                <li><Link to="/login" onClick={close} className={linkCls}>Sign in</Link></li>
                <li><Link to="/register" onClick={close} className={linkCls}>Create account</Link></li>
              </>
            )}
            <li><Link to="/wishlist" onClick={close} className={linkCls}>Wishlist</Link></li>
            <li><Link to="/cart" onClick={close} className={linkCls}>Cart</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow px-3 pb-2">Help</p>
          <ul>
            {HELP_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} onClick={close} className={linkCls}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </Dialog>
  );
}
