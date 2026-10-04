import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import { isSupabaseConfigured, requireSupabase, siteUrl, supabase, throwIfError } from '@/lib/supabase';
import { fetchProfile } from '@/services/account';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  /** True until the initial session (and profile) has been resolved. */
  loading: boolean;
  /** True while the profile for the current user is being (re)loaded. */
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    try {
      setProfile(await fetchProfile(userId));
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      if (active) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) setProfileLoading(true);
      // Defer Supabase calls out of the auth callback to avoid client lock contention.
      window.setTimeout(() => {
        if (active) void loadProfile(next?.user.id);
      }, 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAdmin: profile?.role === 'admin',
      loading,
      profileLoading,
      async signIn(email, password) {
        const { error } = await requireSupabase().auth.signInWithPassword({ email, password });
        throwIfError(error);
      },
      async signUp(email, password, fullName) {
        const { data, error } = await requireSupabase().auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: `${siteUrl()}/account` },
        });
        throwIfError(error);
        return { needsConfirmation: !data.session };
      },
      async signOut() {
        const { error } = await requireSupabase().auth.signOut();
        throwIfError(error);
      },
      async sendPasswordReset(email) {
        const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
          redirectTo: `${siteUrl()}/reset-password`,
        });
        throwIfError(error);
      },
      async updatePassword(password) {
        const { error } = await requireSupabase().auth.updateUser({ password });
        throwIfError(error);
      },
      refreshProfile: () => loadProfile(session?.user.id),
    }),
    [session, profile, loading, profileLoading, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
