import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { subscribeNewsletter } from '@/services/engagement';
import { friendlyError } from '@/lib/authErrors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { cn } from '@/lib/cn';

const schema = z.object({ email: z.string().trim().email('Enter a valid email address') });

export function NewsletterForm({ source, className }: { source: string; className?: string }) {
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(schema) });
  const inputId = `newsletter-${source}`;

  return (
    <form
      noValidate
      className={className}
      onSubmit={handleSubmit(async ({ email }) => {
        setStatus(null);
        if (!isSupabaseConfigured) {
          setStatus({ tone: 'error', text: 'Newsletter signup needs Supabase to be connected (preview mode).' });
          return;
        }
        try {
          const result = await subscribeNewsletter(email, source);
          setStatus({
            tone: 'success',
            text: result === 'already' ? 'You’re already on the list — thanks!' : 'You’re in! Watch your inbox for drop alerts.',
          });
          reset();
        } catch (e) {
          setStatus({ tone: 'error', text: friendlyError(e) });
        }
      })}
    >
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="input"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={`${inputId}-msg`}
          {...register('email')}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={isSubmitting}>
          {isSubmitting ? 'Joining…' : 'Subscribe'}
        </button>
      </div>
      <p
        id={`${inputId}-msg`}
        role={status || errors.email ? 'status' : undefined}
        className={cn('mt-2 min-h-[1.25rem] text-xs', errors.email || status?.tone === 'error' ? 'text-rose-300' : 'text-emerald-300')}
      >
        {errors.email?.message ?? status?.text ?? ''}
      </p>
    </form>
  );
}
