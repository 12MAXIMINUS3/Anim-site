import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react';
import { Logo } from './Logo';
import { NewsletterForm } from './NewsletterForm';
import { HELP_LINKS, LEGAL_LINKS } from './navigation';
import { useSettings } from '@/context/SettingsContext';
import { catalog } from '@/services/catalog';
import { useAsync } from '@/hooks/useAsync';
import { ANIME_SERIES, seriesHref } from '@/data/series';

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/', icon: Instagram },
  { label: 'X (Twitter)', href: 'https://x.com/', icon: Twitter },
  { label: 'YouTube', href: 'https://www.youtube.com/', icon: Youtube },
  { label: 'Facebook', href: 'https://www.facebook.com/', icon: Facebook },
];

export function Footer() {
  const { settings } = useSettings();
  const { data: categories } = useAsync(() => catalog.listCategories(), []);
  const year = new Date().getFullYear();
  const linkCls = 'inline-block py-1.5 text-sm text-ink-300 hover:text-white sm:py-0';

  return (
    <footer className="mt-24 border-t border-ink-800 bg-ink-950">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
        <div className="space-y-5">
          <Logo />
          <p className="max-w-sm text-sm text-ink-400">
            A collector-run vault of original scale figures, statues and display gear. Every piece in this demo store is fictional placeholder
            inventory.
          </p>
          <ul className="space-y-2 text-sm text-ink-300">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-nova-400" aria-hidden="true" />
              <a href={`mailto:${settings.storeEmail}`} className="hover:text-white">
                {settings.storeEmail}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-nova-400" aria-hidden="true" />
              <a href={`tel:${settings.storePhone.replace(/[^+\d]/g, '')}`} className="hover:text-white">
                {settings.storePhone}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-nova-400" aria-hidden="true" />
              <span>{settings.storeAddress}</span>
            </li>
          </ul>
          <ul className="flex gap-2" aria-label="Social media (placeholder links)">
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="icon-btn border border-ink-700" aria-label={`${label} (placeholder link, opens in new tab)`}>
                  <Icon className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Shop categories">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Shop</h2>
          <ul className="space-y-1 sm:space-y-2.5">
            <li><Link to="/shop" className={linkCls}>All products</Link></li>
            {(categories ?? []).map((c) => (
              <li key={c.id}>
                <Link to={`/category/${c.slug}`} className={linkCls}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Anime series">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Anime</h2>
          <ul className="space-y-1 sm:space-y-2.5">
            {ANIME_SERIES.map((s) => (
              <li key={s.slug}>
                <Link to={seriesHref(s)} className={linkCls}>
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help and policies">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Help</h2>
          <ul className="space-y-1 sm:space-y-2.5">
            {[...HELP_LINKS, ...LEGAL_LINKS].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className={linkCls}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li><Link to="/account" className={linkCls}>My account</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white">Drop alerts</h2>
          <p className="mb-4 text-sm text-ink-400">New preorders, restocks and members-only codes. No spam, unsubscribe anytime.</p>
          <NewsletterForm source="footer" />
        </div>
      </div>
      <div className="border-t border-ink-800">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-ink-500 sm:flex-row">
          <p>© {year} Nova Figure Vault. Demo storefront — all products and characters are fictional.</p>
          <p>Payments are simulated. No real transactions are processed.</p>
        </div>
      </div>
    </footer>
  );
}
