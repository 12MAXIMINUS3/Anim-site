import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { emailSchema } from '@/lib/schemas';
import { friendlyError } from '@/lib/authErrors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSeo } from '@/lib/seo';
import { Field, FormAlert } from '@/components/ui/FormField';
import { SetupRequired } from '@/components/ui/SetupRequired';
import { AuthCard } from './AuthCard';

const schema = z.object({ email: emailSchema });

export default function ForgotPasswordPage() {
  useSeo({ title: 'Reset password', noIndex: true });
  const { sendPasswordReset } = useAuth();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(schema) });

  if (!isSupabaseConfigured) return <SetupRequired feature="password reset" />;

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your account email and we’ll send you a secure link to choose a new password."
      footer={
        <Link to="/login" className="font-semibold text-nova-300 hover:text-pulse-300">
          ← Back to sign in
        </Link>
      }
    >
      {sentTo ? (
        <FormAlert tone="success" message={`If an account exists for ${sentTo}, a reset link is on its way. The link expires in one hour.`} />
      ) : (
        <form
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(async ({ email }) => {
            setError(null);
            try {
              await sendPasswordReset(email);
              setSentTo(email);
            } catch (e) {
              setError(friendlyError(e));
            }
          })}
        >
          <Field label="Email" error={errors.email?.message} required>
            <input type="email" autoComplete="email" className="input" {...register('email')} />
          </Field>
          <FormAlert message={error} />
          <button type="submit" className="btn-primary w-full py-3" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
