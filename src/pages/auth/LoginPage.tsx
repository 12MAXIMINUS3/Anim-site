import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { emailSchema } from '@/lib/schemas';
import { friendlyError } from '@/lib/authErrors';
import { useSeo } from '@/lib/seo';
import { toast } from '@/store/toastStore';
import { Field, FormAlert } from '@/components/ui/FormField';
import { AuthCard } from './AuthCard';

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password'),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  useSeo({ title: 'Sign in', noIndex: true });
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to sync your cart and wishlist and view your orders."
      footer={
        <>
          New to Figure Haven?{' '}
          <Link to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-nova-300 hover:text-pulse-300">
            Create an account
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
            await signIn(v.email, v.password);
            toast.success('Signed in', 'Welcome back to Figure Haven.');
            navigate(redirect && redirect.startsWith('/') ? redirect : '/account', { replace: true });
          } catch (e) {
            setError(friendlyError(e));
          }
        })}
      >
        <Field label="Email" error={errors.email?.message} required>
          <input type="email" autoComplete="email" className="input" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message} required>
          <input type="password" autoComplete="current-password" className="input" {...register('password')} />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-nova-300 hover:text-pulse-300">
            Forgot password?
          </Link>
        </div>
        <FormAlert message={error} />
        <button type="submit" className="btn-primary w-full py-3" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthCard>
  );
}
