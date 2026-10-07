import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SetupRequired } from '@/components/ui/SetupRequired';
import { Spinner } from '@/components/ui/States';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (!isSupabaseConfigured) return <SetupRequired feature="customer accounts" />;
  if (loading) return <Spinner label="Checking your session" className="py-32" />;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, profile, isAdmin, loading, profileLoading } = useAuth();
  const location = useLocation();
  if (!isSupabaseConfigured) return <SetupRequired feature="the admin dashboard" />;
  // Only block while the profile for *this* user is unknown. Background refreshes (token
  // renewals, other tabs) keep the page mounted so unsaved admin edits are not lost.
  if (loading || (profileLoading && profile?.id !== user?.id)) return <Spinner label="Checking permissions" className="py-32" />;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isAdmin) {
    return (
      <div className="container-page py-24">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-rose-400" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Admins only</h1>
          <p className="mt-2 text-sm text-ink-300">
            Your account doesn’t have access to the admin dashboard. An existing admin can grant access from the Customers page, or see the
            README for promoting the first admin.
          </p>
          <Link to="/" className="btn-primary mt-6">
            Back to store
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

/** Redirects signed-in users away from login/register pages. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get('redirect');
  if (!isSupabaseConfigured) return <SetupRequired feature="sign-in and registration" />;
  if (loading) return <Spinner className="py-32" />;
  if (user) return <Navigate to={redirect && redirect.startsWith('/') ? redirect : '/account'} replace />;
  return <>{children}</>;
}
