import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import type { Address } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { deleteAddress, listAddresses, saveAddress } from '@/services/account';
import { useAsync } from '@/hooks/useAsync';
import { addressFields, phoneSchema } from '@/lib/schemas';
import { COUNTRIES, countryName } from '@/lib/countries';
import { friendlyError } from '@/lib/authErrors';
import { toast } from '@/store/toastStore';
import { Dialog } from '@/components/ui/Dialog';
import { Field, FormAlert } from '@/components/ui/FormField';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';

const schema = z.object({
  label: z.string().trim().min(1, 'Give this address a label').max(30),
  ...addressFields,
  phone: phoneSchema.or(z.literal('')),
  isDefault: z.boolean(),
});
type Values = z.infer<typeof schema>;

export function AddressBook() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => (user ? listAddresses(user.id) : Promise.resolve([])), [user?.id]);
  const [editing, setEditing] = useState<Address | 'new' | null>(null);

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Saved addresses</h2>
        <button type="button" className="btn-primary px-4 py-2" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add address
        </button>
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState icon={<MapPin className="h-7 w-7" aria-hidden="true" />} title="No saved addresses" description="Add an address to speed up checkout." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.map((a) => (
            <li key={a.id} className="card flex flex-col p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{a.label}</p>
                {a.isDefault && (
                  <span className="flex items-center gap-1 rounded-md bg-nova-500/15 px-2 py-0.5 text-xs text-nova-200">
                    <Star className="h-3 w-3 fill-current" aria-hidden="true" /> Default
                  </span>
                )}
              </div>
              <address className="mt-2 text-sm not-italic leading-relaxed text-ink-300">
                {a.fullName}
                <br />
                {a.line1}
                {a.line2 && (
                  <>
                    <br />
                    {a.line2}
                  </>
                )}
                <br />
                {a.city}, {a.state} {a.postalCode}
                <br />
                {countryName(a.country)}
                {a.phone && (
                  <>
                    <br />
                    {a.phone}
                  </>
                )}
              </address>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setEditing(a)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                </button>
                {!a.isDefault && (
                  <button
                    type="button"
                    className="btn-ghost px-3 py-1.5 text-xs"
                    onClick={async () => {
                      try {
                        await saveAddress(user.id, { ...a, isDefault: true }, a.id);
                        reload();
                      } catch (e) {
                        toast.error('Could not update address', friendlyError(e));
                      }
                    }}
                  >
                    Set default
                  </button>
                )}
                <button
                  type="button"
                  className="btn-ghost px-3 py-1.5 text-xs text-rose-300"
                  aria-label={`Delete address ${a.label}`}
                  onClick={async () => {
                    if (!window.confirm(`Delete the address “${a.label}”?`)) return;
                    try {
                      await deleteAddress(a.id);
                      toast.success('Address deleted');
                      reload();
                    } catch (e) {
                      toast.error('Could not delete address', friendlyError(e));
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add address' : 'Edit address'} size="lg">
        {editing !== null && (
          <AddressForm
            initial={editing === 'new' ? null : editing}
            isFirst={!data?.length}
            onSave={async (values) => {
              await saveAddress(
                user.id,
                { ...values, line2: values.line2 || null, phone: values.phone || null },
                editing === 'new' ? undefined : editing.id,
              );
              toast.success('Address saved');
              setEditing(null);
              reload();
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function AddressForm({ initial, isFirst, onSave }: { initial: Address | null; isFirst: boolean; onSave: (v: Values) => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: initial?.label ?? 'Home',
      fullName: initial?.fullName ?? '',
      phone: initial?.phone ?? '',
      line1: initial?.line1 ?? '',
      line2: initial?.line2 ?? '',
      city: initial?.city ?? '',
      state: initial?.state ?? '',
      postalCode: initial?.postalCode ?? '',
      country: initial?.country ?? 'US',
      isDefault: initial?.isDefault ?? isFirst,
    },
  });

  return (
    <form
      noValidate
      className="grid gap-4 pt-4 sm:grid-cols-2"
      onSubmit={handleSubmit(async (v) => {
        setError(null);
        try {
          await onSave(v);
        } catch (e) {
          setError(friendlyError(e));
        }
      })}
    >
      <Field label="Label" error={errors.label?.message} required>
        <input className="input" placeholder="Home, Office…" {...register('label')} />
      </Field>
      <Field label="Full name" error={errors.fullName?.message} required>
        <input autoComplete="name" className="input" {...register('fullName')} />
      </Field>
      <Field label="Address line 1" error={errors.line1?.message} required className="sm:col-span-2">
        <input autoComplete="address-line1" className="input" {...register('line1')} />
      </Field>
      <Field label="Address line 2" error={errors.line2?.message} className="sm:col-span-2">
        <input autoComplete="address-line2" className="input" {...register('line2')} />
      </Field>
      <Field label="City" error={errors.city?.message} required>
        <input autoComplete="address-level2" className="input" {...register('city')} />
      </Field>
      <Field label="State / province" error={errors.state?.message} required>
        <input autoComplete="address-level1" className="input" {...register('state')} />
      </Field>
      <Field label="Postal code" error={errors.postalCode?.message} required>
        <input autoComplete="postal-code" className="input" {...register('postalCode')} />
      </Field>
      <Field label="Country" error={errors.country?.message} required>
        <select className="input" autoComplete="country" {...register('country')}>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Phone" error={errors.phone?.message}>
        <input type="tel" autoComplete="tel" className="input" {...register('phone')} />
      </Field>
      <label className="flex items-center gap-2.5 self-end pb-3 text-sm text-ink-300">
        <input type="checkbox" className="h-4 w-4 accent-nova-500" {...register('isDefault')} />
        Use as default address
      </label>
      <div className="sm:col-span-2">
        <FormAlert message={error} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save address'}
        </button>
      </div>
    </form>
  );
}
