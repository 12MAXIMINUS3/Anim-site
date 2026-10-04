import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star } from 'lucide-react';
import type { Product, Review } from '@/types';
import { catalog } from '@/services/catalog';
import { createReview } from '@/services/engagement';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/context/AuthContext';
import { Rating } from '@/components/ui/Rating';
import { Field, FormAlert } from '@/components/ui/FormField';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { formatDate } from '@/lib/format';
import { friendlyError } from '@/lib/authErrors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/cn';

const schema = z.object({
  rating: z.number().int().min(1, 'Choose a rating').max(5),
  title: z.string().trim().min(3, 'Add a short title').max(80),
  body: z.string().trim().min(10, 'Tell other collectors a bit more (10+ characters)').max(1500),
});
type FormValues = z.infer<typeof schema>;

export function ReviewsSection({ product }: { product: Product }) {
  const { user, profile } = useAuth();
  const location = useLocation();
  const { data, loading, error, reload } = useAsync(() => catalog.listReviews(product.id), [product.id]);
  const [added, setAdded] = useState<Review[]>([]);
  const reviews = [...added, ...(data ?? [])];
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const alreadyReviewed = Boolean(user && reviews.some((r) => r.userId === user.id));

  return (
    <section aria-labelledby="reviews-heading" className="scroll-mt-28" id="reviews">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="reviews-heading" className="text-2xl font-bold">
            Collector reviews
          </h2>
          {reviews.length > 0 && (
            <div className="mt-2 flex items-center gap-3">
              <Rating value={avg} size="md" />
              <span className="text-sm text-ink-300">
                {avg.toFixed(1)} out of 5 · {reviews.length} review{reviews.length === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {loading && Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-28" />)}
          {error && <ErrorState title="Reviews could not be loaded" error={error} onRetry={reload} />}
          {!loading && !error && reviews.length === 0 && <p className="text-sm text-ink-400">No reviews yet — be the first to share your thoughts.</p>}
          {reviews.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Rating value={r.rating} />
                <time className="text-xs text-ink-400" dateTime={r.createdAt}>
                  {formatDate(r.createdAt)}
                </time>
              </div>
              <h3 className="mt-2 font-semibold">{r.title}</h3>
              <p className="mt-1 text-sm text-ink-300">{r.body}</p>
              <p className="mt-3 text-xs text-ink-400">— {r.authorName}</p>
            </article>
          ))}
        </div>

        <div className="card h-fit p-5">
          <h3 className="font-semibold">Write a review</h3>
          {!isSupabaseConfigured ? (
            <p className="mt-2 text-sm text-ink-400">Reviews can be submitted once Supabase is connected.</p>
          ) : !user ? (
            <p className="mt-2 text-sm text-ink-400">
              <Link to={`/login?redirect=${encodeURIComponent(location.pathname)}`} className="text-nova-300 hover:text-pulse-300">
                Sign in
              </Link>{' '}
              to share your thoughts with other collectors.
            </p>
          ) : alreadyReviewed ? (
            <p className="mt-2 text-sm text-ink-400">Thanks — you’ve already reviewed this product.</p>
          ) : (
            <ReviewForm
              onSubmit={async (values) => {
                const review = await createReview({
                  productId: product.id,
                  userId: user.id,
                  authorName: profile?.fullName?.trim() || user.email?.split('@')[0] || 'Collector',
                  ...values,
                });
                setAdded((a) => [review, ...a]);
                toast.success('Review posted', 'Thanks for helping other collectors!');
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function ReviewForm({ onSubmit }: { onSubmit: (v: FormValues) => Promise<void> }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { rating: 0, title: '', body: '' } });
  const rating = watch('rating');

  return (
    <form
      className="mt-4 space-y-4"
      noValidate
      onSubmit={handleSubmit(async (v) => {
        setServerError(null);
        try {
          await onSubmit(v);
          reset();
        } catch (e) {
          setServerError(friendlyError(e));
        }
      })}
    >
      <fieldset>
        <legend className="label">Rating</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onClick={() => setValue('rating', n, { shouldValidate: true })}
              className="rounded p-0.5"
            >
              <Star className={cn('h-7 w-7', n <= rating ? 'fill-amber-300 text-amber-300' : 'text-ink-600')} />
            </button>
          ))}
        </div>
        {errors.rating && <p className="field-error">{errors.rating.message}</p>}
      </fieldset>
      <Field label="Title" error={errors.title?.message} required>
        <input className="input" {...register('title')} />
      </Field>
      <Field label="Review" error={errors.body?.message} required>
        <textarea className="input min-h-28" {...register('body')} />
      </Field>
      <FormAlert message={serverError} />
      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Posting…' : 'Post review'}
      </button>
    </form>
  );
}
