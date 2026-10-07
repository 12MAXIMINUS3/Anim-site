import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSettings } from '@/context/SettingsContext';
import { saveHomeText, saveSiteSettings } from '@/services/engagement';
import { emailSchema } from '@/lib/schemas';
import { friendlyError } from '@/lib/authErrors';
import { toast } from '@/store/toastStore';
import { Field, FormAlert } from '@/components/ui/FormField';
import { AdminPageHeader } from './AdminLayout';

const schema = z.object({
  announcement: z.string().trim().max(200, 'Keep it under 200 characters'),
  storeEmail: emailSchema,
  storePhone: z.string().trim().max(40),
  storeAddress: z.string().trim().max(200),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']),
  shippingMessage: z.string().trim().min(5, 'Add a shipping message').max(300),
});
type Values = z.infer<typeof schema>;

export default function AdminSettings() {
  const { settings, refresh } = useSettings();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema), values: settings as Values });

  return (
    <>
      <AdminPageHeader title="Settings" description="Storefront-wide content and defaults." />
      <form
        noValidate
        className="card grid max-w-3xl gap-5 p-6"
        onSubmit={handleSubmit(async (v) => {
          setError(null);
          try {
            await saveSiteSettings(v);
            await refresh();
            reset(v);
            toast.success('Settings saved');
          } catch (e) {
            setError(friendlyError(e));
          }
        })}
      >
        <Field label="Announcement bar message" error={errors.announcement?.message} hint="Leave blank to hide the announcement bar.">
          <input className="input" {...register('announcement')} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Store email" error={errors.storeEmail?.message} required>
            <input type="email" className="input" {...register('storeEmail')} />
          </Field>
          <Field label="Store phone" error={errors.storePhone?.message}>
            <input className="input" {...register('storePhone')} />
          </Field>
        </div>
        <Field label="Store address" error={errors.storeAddress?.message}>
          <input className="input" {...register('storeAddress')} />
        </Field>
        <Field
          label="Store currency"
          error={errors.currency?.message}
          hint="Used for cart and order totals. Checkout pricing in the database function is USD — update create_order() if you change this."
        >
          <select className="input" {...register('currency')}>
            {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Shipping message" error={errors.shippingMessage?.message} required>
          <textarea className="input min-h-20" {...register('shippingMessage')} />
        </Field>
        <FormAlert message={error} />
        <div>
          <button type="submit" className="btn-primary" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
      <HomeTextForm />
    </>
  );
}

const homeTextSchema = z.object({
  badge: z.string().trim().max(60),
  title: z.string().trim().min(2, 'Add a headline').max(90),
  titleHighlight: z.string().trim().max(60),
  subtitle: z.string().trim().max(240),
  primaryCta: z.string().trim().min(2, 'Add button text').max(30),
  secondaryCta: z.string().trim().min(2, 'Add button text').max(30),
});
type HomeTextValues = z.infer<typeof homeTextSchema>;

/** Home page hero text: headline, highlighted words, sentence and buttons. */
function HomeTextForm() {
  const { homeText, refresh } = useSettings();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<HomeTextValues>({ resolver: zodResolver(homeTextSchema), values: homeText });

  return (
    <form
      noValidate
      className="card mt-6 grid max-w-3xl gap-5 p-6"
      onSubmit={handleSubmit(async (v) => {
        setError(null);
        try {
          await saveHomeText({ ...homeText, ...v });
          await refresh();
          reset(v);
          toast.success('Home page text saved', 'It is live on the home page.');
        } catch (e) {
          setError(friendlyError(e));
        }
      })}
    >
      <div>
        <h2 className="text-lg font-semibold">Home page text</h2>
        <p className="mt-1 text-xs text-ink-400">The headline area at the top of the home page.</p>
      </div>
      <Field label="Small tag above the headline" error={errors.badge?.message} hint="Leave blank to hide it.">
        <input className="input" {...register('badge')} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Headline" error={errors.title?.message} required>
          <input className="input" {...register('title')} />
        </Field>
        <Field label="Highlighted words (purple)" error={errors.titleHighlight?.message} hint="Shown right after the headline.">
          <input className="input" {...register('titleHighlight')} />
        </Field>
      </div>
      <Field label="Sentence under the headline" error={errors.subtitle?.message}>
        <textarea className="input min-h-20" {...register('subtitle')} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Main button" error={errors.primaryCta?.message} required>
          <input className="input" {...register('primaryCta')} />
        </Field>
        <Field label="Second button" error={errors.secondaryCta?.message} required>
          <input className="input" {...register('secondaryCta')} />
        </Field>
      </div>
      <FormAlert message={error} />
      <div>
        <button type="submit" className="btn-primary" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? 'Saving…' : 'Save home page text'}
        </button>
      </div>
    </form>
  );
}
