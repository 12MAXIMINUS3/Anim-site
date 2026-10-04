import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import { readJson, writeJson } from '@/lib/storage';

const KEY = 'nfv-cookie-consent';
type Consent = { choice: 'all' | 'essential'; at: string };

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent | null>(() => readJson<Consent | null>(KEY, null));
  if (consent) return null;

  const choose = (choice: Consent['choice']) => {
    const value = { choice, at: new Date().toISOString() };
    writeJson(KEY, value);
    setConsent(value);
  };

  return (
    <div role="region" aria-label="Cookie consent" className="fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:left-6 sm:max-w-md">
      <div className="card flex flex-col gap-4 p-5 shadow-2xl backdrop-blur">
        <div className="flex gap-3">
          <Cookie className="h-6 w-6 shrink-0 text-amber-300" aria-hidden="true" />
          <p className="text-sm text-ink-300">
            We use essential storage to keep your cart, wishlist and sign-in working. Optional analytics are not enabled in this demo. Read
            our{' '}
            <Link to="/privacy" className="text-nova-300 underline underline-offset-2 hover:text-pulse-300">
              privacy policy
            </Link>
            .
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost px-4 py-2" onClick={() => choose('essential')}>
            Essential only
          </button>
          <button type="button" className="btn-primary px-4 py-2" onClick={() => choose('all')}>
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
