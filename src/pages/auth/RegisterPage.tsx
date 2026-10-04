import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MailCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { emailSchema, passwordSchema } from '@/lib/schemas';
import { friendlyError } from '@/lib/authErrors';
import { useSeo } from '@/lib/seo';
import { toast } from '@/store/toastStore';
import { Field, FormAlert } from '@/components/ui/FormField';
import { AuthCard } from './AuthCard';

const schema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your name').max(80),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v, 'You must accept the terms to continue'),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
type Values = z.infer<typeof schema>;

export default function RegisterPage() {
  useSeo({ title: 'Create account', noIndex: true });
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');
  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { terms: false } });

  if (confirmEmail) {
    return (
      <AuthCard title="Check your inbox">
        <div className="text-center">
          <MailCheck className="mx-auto h-12 w-12 text-pulse-400" aria-hidden="true" />
          <p className="mt-4 text-sm text-ink-300">
            We sent a confirmation link to <strong className="text-white">{confirmEmail}</strong>. Click it to activate your account, then sign in.
          </p>
          <Link to="/login" className="btn-primary mt-6">
            Go to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Save addresses, track orders and sync your wishlist across devices."
      footer={
        <>
          Already have an account?{' '}
          <Link to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-nova-300 hover:text-pulse-300">
            Sign in
          </Link>
        </>
      }
    >
      <form
        noValidate
        className="space-y-5"
        onSubmit={handleSubmit(async (v) => {
          setError(null);
          try {
            const { needsConfirmation } = await signUp(v.email, v.password, v.fullName);
            if (needsConfirmation) {
              setConfirmEmail(v.email);
            } else {
              toast.success('Account created', 'Welcome to Nova Figure Vault!');
              navigate(redirect && redirect.startsWith('/') ? redirect : '/account', { replace: true });
            }
          } catch (e) {
            setError(friendlyError(e));
          }
        })}
      >
        <Field label="Full name" error={errors.fullName?.message} required>
          <input autoComplete="name" className="input" {...register('fullName')} />
        </Field>
        <Field label="Email" error={errors.email?.message} required>
          <input type="email" autoComplete="email" className="input" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message} hint="At least 8 characters, including a letter and a number." required>
          <input type="password" autoComplete="new-password" className="input" {...register('password')} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message} required>
          <input type="password" autoComplete="new-password" className="input" {...register('confirmPassword')} />
        </Field>
        <div>
          <label className="flex items-start gap-2.5 text-sm text-ink-300">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-nova-500" {...register('terms')} />
            <span>
              I agree to the{' '}
              <Link to="/terms" className="text-nova-300 underline">terms</Link> and{' '}
              <Link to="/privacy" className="text-nova-300 underline">privacy policy</Link>.
            </span>
          </label>
          {errors.terms && <p className="field-error">{errors.terms.message}</p>}
        </div>
        <FormAlert message={error} />
        <button type="submit" className="btn-primary w-full py-3" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthCard>
  );
}
