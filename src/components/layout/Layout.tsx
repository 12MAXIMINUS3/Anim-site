import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnnouncementBar } from './AnnouncementBar';
import { Header } from './Header';
import { Footer } from './Footer';
import { CookieConsent } from './CookieConsent';
import { CartDrawer } from '@/components/product/CartDrawer';
import { QuickViewModal } from '@/components/product/QuickViewModal';
import { Spinner } from '@/components/ui/States';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useUiStore } from '@/store/uiStore';

export function Layout() {
  const location = useLocation();
  const setMobileNav = useUiStore((s) => s.setMobileNav);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setMobileNav(false);
  }, [location.pathname, setMobileNav]);

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-nova-600 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      {!isSupabaseConfigured && (
        <div className="bg-amber-400/10 py-1.5 text-center text-xs text-amber-200">
          Preview mode: showing local demo catalog. Connect Supabase to enable accounts, checkout and admin.
        </div>
      )}
      <AnnouncementBar />
      <Header />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Suspense fallback={<Spinner label="Loading page" className="py-32" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <QuickViewModal />
      <CookieConsent />
    </div>
  );
}
