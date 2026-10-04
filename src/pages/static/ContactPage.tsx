import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { sendContactMessage } from '@/services/engagement';
import { emailSchema } from '@/lib/schemas';
import { friendlyError } from '@/lib/authErrors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSeo } from '@/lib/seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { Field, FormAlert } from '@/components/ui/FormField';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email: emailSchema,
  subject: z.string().trim().min(3, 'Add a subject').max(120),
  message: z.string().trim().min(20, 'Please include a few more details (20+ characters)').max(3000),
});
type Values = z.infer<typeof schema>;

export default function ContactPage() {
  useSeo({ title: 'Contact us', description: 'Questions about an order, a preorder or a product? Get in touch with the Nova Figure Vault team.' });
  const { settings } = useSettings();
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  return (
    <>
      <PageHeader title="Contact us" crumbs={[{ label: 'Contact' }]} description="We usually reply within one business day." />
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_360px]">
        <form
          noValidate
          className="card grid gap-4 p-6 sm:grid-cols-2 sm:p-8"
          onSubmit={handleSubmit(async (v) => {
            setStatus(null);
            if (!isSupabaseConfigured) {
              setStatus({ tone: 'error', text: 'The contact form needs Supabase to be connected (preview mode). Please email us instead.' });
              return;
            }
            try {
              await sendContactMessage(v);
              reset();
              setStatus({ tone: 'success', text: 'Thanks! Your message has been received.' });
            } catch (e) {
              setStatus({ tone: 'error', text: friendlyError(e) });
            }
          })}
        >
          <Field label="Name" error={errors.name?.message} required>
            <input autoComplete="name" className="input" {...register('name')} />
          </Field>
          <Field label="Email" error={errors.email?.message} required>
            <input type="email" autoComplete="email" className="input" {...register('email')} />
          </Field>
          <Field label="Subject" error={errors.subject?.message} required className="sm:col-span-2">
            <input className="input" {...register('subject')} />
          </Field>
          <Field label="Message" error={errors.message?.message} required className="sm:col-span-2">
            <textarea className="input min-h-40" {...register('message')} />
          </Field>
          <div className="sm:col-span-2">
            <FormAlert tone={status?.tone ?? 'error'} message={status?.text ?? null} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>
        <aside className="space-y-4">
          <div className="card space-y-4 p-6 text-sm">
            <p className="flex items-start gap-3"><Mail className="h-5 w-5 text-nova-400" aria-hidden="true" /><a className="hover:text-white" href={`mailto:${settings.storeEmail}`}>{settings.storeEmail}</a></p>
            <p className="flex items-start gap-3"><Phone className="h-5 w-5 text-nova-400" aria-hidden="true" /><a className="hover:text-white" href={`tel:${settings.storePhone.replace(/[^+\d]/g, '')}`}>{settings.storePhone}</a></p>
            <p className="flex items-start gap-3"><MapPin className="h-5 w-5 shrink-0 text-nova-400" aria-hidden="true" />{settings.storeAddress}</p>
            <p className="flex items-start gap-3"><Clock className="h-5 w-5 text-nova-400" aria-hidden="true" />Mon–Fri, 9am–5pm PT</p>
          </div>
          <div className="card p-6 text-sm text-ink-300">
            Looking for a quick answer? Check the <Link to="/faq" className="text-nova-300 hover:text-pulse-300">FAQ</Link> or our{' '}
            <Link to="/shipping&returns" className="text-nova-300 hover:text-pulse-300">shipping & returns</Link> policy.
          </div>
        </aside>
      </div>
    </>
  );
}
