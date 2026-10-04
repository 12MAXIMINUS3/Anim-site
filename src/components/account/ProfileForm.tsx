import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/services/account';
import { phoneSchema } from '@/lib/schemas';
import { friendlyError } from '@/lib/authErrors';
import { formatDate } from '@/lib/format';
import { toast } from '@/store/toastStore';
import { Field, FormAlert } from '@/components/ui/FormField';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name').max(80),
  phone: phoneSchema.or(z.literal('')),
});
type Values = z.infer<typeof schema>;

export function ProfileForm() {
  const { user, profile, refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    values: { fullName: profile?.fullName ?? '', phone: profile?.phone ?? '' },
  });

  if (!user) return null;

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold">Profile</h2>
      <p className="mt-1 text-sm text-ink-400">
        {user.email} · Member since {profile ? formatDate(profile.createdAt) : '—'}
        {profile?.role === 'admin' && <span className="ml-2 rounded-md bg-nova-500/20 px-1.5 py-0.5 text-xs text-nova-200">Admin</span>}
      </p>
      <form
        noValidate
        className="mt-6 grid gap-4 sm:grid-cols-2"
        onSubmit={handleSubmit(async (v) => {
          setError(null);
          try {
            await updateProfile(user.id, { fullName: v.fullName, phone: v.phone || null });
            await refreshProfile();
            reset(v);
            toast.success('Profile updated');
          } catch (e) {
            setError(friendlyError(e));
          }
        })}
      >
        <Field label="Full name" error={errors.fullName?.message} required>
          <input autoComplete="name" className="input" {...register('fullName')} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <input type="tel" autoComplete="tel" className="input" {...register('phone')} />
        </Field>
        <div className="sm:col-span-2">
          <FormAlert message={error} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
