import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SiteImages, SiteSettings } from '@/types';
import { seedSettings } from '@/data/seedProducts';
import { emptySiteImages, fetchSiteImages, fetchSiteSettings } from '@/services/engagement';

interface SettingsContextValue {
  settings: SiteSettings;
  /** Images chosen in Admin → Site images (null slots use the built-in defaults). */
  images: SiteImages;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(seedSettings);
  const [images, setImages] = useState<SiteImages>(emptySiteImages);

  const refresh = useCallback(async () => {
    // Keep defaults if either cannot be loaded; the store remains usable.
    const [s, i] = await Promise.allSettled([fetchSiteSettings(), fetchSiteImages()]);
    if (s.status === 'fulfilled') setSettings(s.value);
    if (i.status === 'fulfilled') setImages(i.value);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    link.href = images.favicon ?? '/favicon.svg';
    link.type = images.favicon ? '' : 'image/svg+xml';
  }, [images.favicon]);

  const value = useMemo(() => ({ settings, images, refresh }), [settings, images, refresh]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
