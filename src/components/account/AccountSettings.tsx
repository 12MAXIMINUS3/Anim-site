import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/services/account';
import { passwordSchema } from '@/lib/schemas';
import { friendlyError } from '@/lib/authErrors';
import { toast } from '@/store/toastStore';
import { Field, FormAlert } from '@/components/ui/FormField';

const pwSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
type PwValues = z.infer<typeof pwSchema>;

export function AccountSettings() {
  const { user, profile, updatePassword, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [pwError, setPwError] = useState<string | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PwValues>({ resolver: zodResolver(pwSchema) });

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold">Change password</h2>
        <form
          noValidate
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={handleSubmit(async (v) => {
            setPwError(null);
            try {
              await updatePassword(v.password);
              reset({ password: '', confirmPassword: '' });
              toast.success('Password updated');
            } catch (e) {
              setPwError(friendlyError(e));
            }
          })}
        >
          <Field label="New password" error={errors.password?.message} required>
            <input type="password" autoComplete="new-password" className="input" {...register('password')} />
          </Field>
          <Field label="Confirm new password" error={errors.confirmPassword?.message} required>
            <input type="password" autoComplete="new-password" className="input" {...register('confirmPassword')} />
          </Field>
          <div className="sm:col-span-2">
            <FormAlert message={pwError} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Communication</h2>
        <label className="mt-4 flex items-start gap-3 text-sm text-ink-300">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-nova-500"
            checked={profile?.marketingOptIn ?? false}
            disabled={savingPrefs}
            onChange={async (e) => {
              setSavingPrefs(true);
              try {
                await updateProfile(user.id, { marketingOptIn: e.target.checked });
                await refreshProfile();
                toast.success('Preferences saved');
              } catch (err) {
                toast.error('Could not save preferences', friendlyError(err));
              } finally {
                setSavingPrefs(false);
              }
            }}
          />
          <span>Email me about new drops, restocks and members-only promo codes.</span>
        </label>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Sign out</h2>
          <p className="text-sm text-ink-400">Your cart and wishlist stay saved to your account.</p>
        </div>
        <button
          type="button"
          className="btn-danger"
          onClick={async () => {
            try {
              await signOut();
              navigate('/');
            } catch (e) {
              toast.error('Sign out failed', friendlyError(e));
            }
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
