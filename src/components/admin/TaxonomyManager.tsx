import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import { slugify } from '@/lib/format';
import { friendlyError } from '@/lib/authErrors';
import { toast } from '@/store/toastStore';
import { Dialog } from '@/components/ui/Dialog';
import { Field, FormAlert } from '@/components/ui/FormField';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States';

/** Common shape edited by the taxonomy form (categories and brands). */
export interface TaxonomyRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  position?: number;
  isActive?: boolean;
}

interface Props {
  singular: string;
  /** Shows position/active fields (categories). */
  ordered?: boolean;
  imageLabel: string;
  load: () => Promise<TaxonomyRecord[]>;
  save: (record: Omit<TaxonomyRecord, 'id'>, id?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const schema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes'),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().trim().max(500).optional(),
  position: z.string().regex(/^\d*$/, 'Whole number'),
  isActive: z.boolean(),
});
type Values = z.infer<typeof schema>;

/** Generic CRUD table + modal used for both categories and brands. */
export function TaxonomyManager({ singular, ordered, imageLabel, load, save, remove }: Props) {
  const { data, loading, error, reload } = useAsync(load, []);
  const [editing, setEditing] = useState<TaxonomyRecord | 'new' | null>(null);

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button type="button" className="btn-primary" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New {singular.toLowerCase()}
        </button>
      </div>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState title={`No ${singular.toLowerCase()} records yet`} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-admin min-w-[640px]">
            <thead>
              <tr>
                <th scope="col">{singular}</th>
                <th scope="col">Slug</th>
                {ordered && <th scope="col">Position</th>}
                {ordered && <th scope="col">Status</th>}
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {r.imageUrl ? <ImageWithFallback src={r.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 rounded-lg bg-ink-800" aria-hidden="true" />}
                      <div>
                        <p className="font-medium text-white">{r.name}</p>
                        {r.description && <p className="line-clamp-1 max-w-sm text-xs text-ink-500">{r.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="text-ink-300">{r.slug}</td>
                  {ordered && <td>{r.position}</td>}
                  {ordered && <td>{r.isActive ? <span className="text-emerald-300">Active</span> : <span className="text-ink-500">Hidden</span>}</td>}
                  <td>
                    <div className="flex justify-end gap-1">
                      <button type="button" className="icon-btn h-8 w-8" onClick={() => setEditing(r)} aria-label={`Edit ${r.name}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="icon-btn h-8 w-8 hover:text-rose-300"
                        aria-label={`Delete ${r.name}`}
                        onClick={async () => {
                          if (!window.confirm(`Delete “${r.name}”? Products using it will become unassigned.`)) return;
                          try {
                            await remove(r.id);
                            toast.success(`${singular} deleted`);
                            reload();
                          } catch (e) {
                            toast.error(`Could not delete ${singular.toLowerCase()}`, friendlyError(e));
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? `New ${singular.toLowerCase()}` : `Edit ${singular.toLowerCase()}`}>
        {editing !== null && (
          <TaxonomyForm
            initial={editing === 'new' ? null : editing}
            ordered={ordered}
            imageLabel={imageLabel}
            nextPosition={(data?.length ?? 0) + 1}
            onSave={async (v) => {
              await save(
                {
                  name: v.name,
                  slug: v.slug,
                  description: v.description || null,
                  imageUrl: v.imageUrl || null,
                  position: Number(v.position || 0),
                  isActive: v.isActive,
                },
                editing === 'new' ? undefined : editing.id,
              );
              toast.success(`${singular} saved`);
              setEditing(null);
              reload();
            }}
          />
        )}
      </Dialog>
    </>
  );
}

function TaxonomyForm({
  initial,
  ordered,
  imageLabel,
  nextPosition,
  onSave,
}: {
  initial: TaxonomyRecord | null;
  ordered?: boolean;
  imageLabel: string;
  nextPosition: number;
  onSave: (v: Values) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      slug: initial?.slug ?? '',
      description: initial?.description ?? '',
      imageUrl: initial?.imageUrl ?? '',
      position: String(initial?.position ?? nextPosition),
      isActive: initial?.isActive ?? true,
    },
  });

  return (
    <form
      noValidate
      className="space-y-4 pt-4"
      onSubmit={handleSubmit(async (v) => {
        setError(null);
        try {
          await onSave(v);
        } catch (e) {
          setError(friendlyError(e));
        }
      })}
    >
      <Field label="Name" error={errors.name?.message} required>
        <input
          className="input"
          {...register('name', {
            onChange: (e) => {
              if (!slugTouched) setValue('slug', slugify(e.target.value));
            },
          })}
        />
      </Field>
      <Field label="Slug" error={errors.slug?.message} required>
        <input className="input" {...register('slug', { onChange: () => setSlugTouched(true) })} />
      </Field>
      <Field label="Description" error={errors.description?.message}>
        <textarea className="input min-h-20" {...register('description')} />
      </Field>
      <Field label={imageLabel} error={errors.imageUrl?.message} hint="Absolute URL or site path, e.g. /images/categories/statues.svg">
        <input className="input" {...register('imageUrl')} />
      </Field>
      {ordered && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Position" error={errors.position?.message}>
            <input inputMode="numeric" className="input" {...register('position')} />
          </Field>
          <label className="flex items-center gap-2.5 self-end pb-3 text-sm text-ink-300">
            <input type="checkbox" className="h-4 w-4 accent-nova-500" {...register('isActive')} /> Visible on storefront
          </label>
        </div>
      )}
      <FormAlert message={error} />
      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
