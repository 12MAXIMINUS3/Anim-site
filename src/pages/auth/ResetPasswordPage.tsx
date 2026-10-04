import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { passwordSchema } from '@/lib/schemas';
import { friendlyError } from '@/lib/authErrors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSeo } from '@/lib/seo';
import { toast } from '@/store/toastStore';
import { Field, FormAlert } from '@/components/ui/FormField';
import { SetupRequired } from '@/components/ui/SetupRequired';
import { Spinner } from '@/components/ui/States';
import { AuthCard } from './AuthCard';

const schema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
type Values = z.infer<typeof schema>;

/**
 * Landing page for the Supabase password-recovery email link. Supabase
 * exchanges the token in the URL for a temporary session automatically.
 */
export default function ResetPasswordPage() {
  useSeo({ title: 'Choose a new password', noIndex: true });
  const { user, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  if (!isSupabaseConfigured) return <SetupRequired feature="password reset" />;
  if (loading) return <Spinner label="Verifying reset link" className="py-32" />;

  if (!user) {
    return (
      <AuthCard title="Reset link expired" subtitle="This password-reset link is invalid or has expired.">
        <Link to="/forgot-password" className="btn-primary w-full">
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" subtitle={`Updating the password for ${user.email}.`}>
      <form
        noValidate
        className="space-y-5"
        onSubmit={handleSubmit(async (v) => {
          setError(null);
          try {
            await updatePassword(v.password);
            toast.success('Password updated', 'You can now use your new password.');
            navigate('/account', { replace: true });
          } catch (e) {
            setError(friendlyError(e));
          }
        })}
      >
        <Field label="New password" error={errors.password?.message} hint="At least 8 characters, including a letter and a number." required>
          <input type="password" autoComplete="new-password" className="input" {...register('password')} />
        </Field>
        <Field label="Confirm new password" error={errors.confirmPassword?.message} required>
          <input type="password" autoComplete="new-password" className="input" {...register('confirmPassword')} />
        </Field>
        <FormAlert message={error} />
        <button type="submit" className="btn-primary w-full py-3" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </AuthCard>
  );
}
