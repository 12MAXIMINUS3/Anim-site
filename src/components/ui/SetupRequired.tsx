import { Database } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Shown on features that need a live Supabase backend when running in preview mode. */
export function SetupRequired({ feature }: { feature: string }) {
  return (
    <div className="container-page py-16">
      <div className="card mx-auto max-w-xl p-8 text-center">
        <Database className="mx-auto mb-4 h-10 w-10 text-nova-400" aria-hidden="true" />
        <h1 className="text-2xl font-bold">Connect Supabase to enable {feature}</h1>
        <p className="mt-3 text-sm text-ink-300">
          The store is running in read-only preview mode. Copy <code className="text-pulse-300">.env.example</code> to{' '}
          <code className="text-pulse-300">.env.local</code>, add your Supabase URL and anon key, run{' '}
          <code className="text-pulse-300">supabase/schema.sql</code> and <code className="text-pulse-300">supabase/seed.sql</code>, then
          restart the dev server. See the README for step-by-step instructions.
        </p>
        <Link to="/shop" className="btn-primary mt-6">
          Keep browsing
        </Link>
      </div>
    </div>
  );
}
