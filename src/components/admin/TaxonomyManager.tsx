import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImagePlus, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import { slugify } from '@/lib/format';
import { friendlyError } from '@/lib/authErrors';
import { toast } from '@/store/toastStore';
import { Dialog } from '@/components/ui/Dialog';
import { Field, FormAlert } from '@/components/ui/FormField';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States';
import { deleteSiteFile, uploadSiteFile } from '@/services/admin';

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
  /** Storage folder for uploaded images, e.g. "categories". */
  uploadFolder: string;
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
export function TaxonomyManager({ singular, ordered, imageLabel, uploadFolder, load, save, remove }: Props) {
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
                      <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setEditing(r)} aria-label={`Edit ${r.name}`}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
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
            uploadFolder={uploadFolder}
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
              // Clean up an uploaded image that was replaced or removed.
              const previous = editing === 'new' ? null : editing.imageUrl;
              if (previous && previous !== (v.imageUrl || null)) await deleteSiteFile(previous).catch(() => undefined);
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
  uploadFolder,
  nextPosition,
  onSave,
}: {
  initial: TaxonomyRecord | null;
  ordered?: boolean;
  imageLabel: string;
  uploadFolder: string;
  nextPosition: number;
  onSave: (v: Values) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
      <ImagePicker
        label={imageLabel}
        value={watch('imageUrl') || ''}
        folder={`${uploadFolder}/${watch('slug') || 'new'}`}
        onChange={(url) => setValue('imageUrl', url, { shouldDirty: true })}
      />
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

/** Image field with preview and Upload / Replace / Remove buttons. */
function ImagePicker({ label, value, folder, onChange }: { label: string; value: string; folder: string; onChange: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex items-start gap-4">
        <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-ink-700 bg-ink-850">
          {value ? (
            <ImageWithFallback src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-[11px] text-ink-500">No image</span>
          )}
          {busy && <span className="absolute inset-0 flex items-center justify-center bg-ink-950/70 text-xs text-white">Uploading…</span>}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              setBusy(true);
              setError(null);
              try {
                onChange(await uploadSiteFile(file, folder));
              } catch (err) {
                setError(friendlyError(err));
              } finally {
                setBusy(false);
              }
            }}
          />
          <button type="button" className="btn-secondary px-3 py-2" disabled={busy} onClick={() => input.current?.click()}>
            {value ? <Upload className="h-4 w-4" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
            {value ? 'Replace image' : 'Upload image'}
          </button>
          {value && (
            <button type="button" className="btn-ghost px-3 py-2 text-rose-300 hover:text-rose-200" disabled={busy} onClick={() => onChange('')}>
              <X className="h-4 w-4" aria-hidden="true" /> Remove image
            </button>
          )}
          <p className="text-xs text-ink-500">JPG, PNG or WebP, up to 10 MB. Click Save to apply.</p>
        </div>
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
