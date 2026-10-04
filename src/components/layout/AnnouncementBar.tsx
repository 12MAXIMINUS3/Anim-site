import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export function AnnouncementBar() {
  const { settings } = useSettings();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('nfv-announce') === settings.announcement;
    } catch {
      return false;
    }
  });
  if (!settings.announcement || dismissed) return null;
  return (
    <div className="relative bg-gradient-to-r from-nova-700 via-indigo-700 to-nova-700 text-white">
      <div className="container-page flex items-center justify-center gap-2 py-2 pr-10 text-center text-xs font-medium sm:text-sm">
        <Sparkles className="hidden h-4 w-4 shrink-0 text-pulse-300 sm:block" aria-hidden="true" />
        <p>{settings.announcement}</p>
      </div>
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
        aria-label="Dismiss announcement"
        onClick={() => {
          try {
            sessionStorage.setItem('nfv-announce', settings.announcement);
          } catch {
            /* ignore */
          }
          setDismissed(true);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
