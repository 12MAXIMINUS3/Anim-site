import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SiteSettings } from '@/types';
import { seedSettings } from '@/data/seedProducts';
import { fetchSiteSettings } from '@/services/engagement';

interface SettingsContextValue {
  settings: SiteSettings;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(seedSettings);

  const refresh = useCallback(async () => {
    try {
      setSettings(await fetchSiteSettings());
    } catch {
      // Keep defaults if settings cannot be loaded; the store remains usable.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ settings, refresh }), [settings, refresh]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
