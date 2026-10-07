import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { HomeText, SiteImages, SiteSettings } from '@/types';
import { seedSettings } from '@/data/seedProducts';
import { ANIME_SERIES, type Series } from '@/data/series';
import { DEFAULT_HOME_TEXT, emptySiteImages, fetchHomeText, fetchSeries, fetchSiteImages, fetchSiteSettings } from '@/services/engagement';

interface SettingsContextValue {
  settings: SiteSettings;
  /** Images chosen in Admin → Site images (null slots use the built-in defaults). */
  images: SiteImages;
  /** Anime series list (Admin → Series). */
  series: Series[];
  /** Home page hero text (Admin → Settings). */
  homeText: HomeText;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(seedSettings);
  const [images, setImages] = useState<SiteImages>(emptySiteImages);
  const [series, setSeries] = useState<Series[]>(ANIME_SERIES);
  const [homeText, setHomeText] = useState<HomeText>(DEFAULT_HOME_TEXT);

  const refresh = useCallback(async () => {
    // Keep defaults for anything that cannot be loaded; the store remains usable.
    const [s, i, se, h] = await Promise.allSettled([fetchSiteSettings(), fetchSiteImages(), fetchSeries(), fetchHomeText()]);
    if (s.status === 'fulfilled') setSettings(s.value);
    if (i.status === 'fulfilled') setImages(i.value);
    if (se.status === 'fulfilled') setSeries(se.value);
    if (h.status === 'fulfilled') setHomeText(h.value);
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

  const value = useMemo(() => ({ settings, images, series, homeText, refresh }), [settings, images, series, homeText, refresh]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
