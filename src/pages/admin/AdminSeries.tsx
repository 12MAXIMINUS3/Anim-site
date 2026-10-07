import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Plus, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import type { Series } from '@/data/series';
import { useSettings } from '@/context/SettingsContext';
import { saveHomeText, saveSeries, saveSiteImages } from '@/services/engagement';
import { deleteSiteFile, renameSeriesProducts, uploadSiteFile } from '@/services/admin';
import { slugify } from '@/lib/format';
import { friendlyError } from '@/lib/authErrors';
import { toast } from '@/store/toastStore';
import { Field, FormAlert } from '@/components/ui/FormField';
import { AdminPageHeader } from './AdminLayout';
import { cn } from '@/lib/cn';

/** Colour pairs given to newly added series (the tile's gradient). */
const NEW_COLORS: Array<[string, string]> = [
  ['#7c3aed', '#db2777'],
  ['#0f766e', '#1d4ed8'],
  ['#b45309', '#7c2d12'],
  ['#be123c', '#4c1d95'],
  ['#15803d', '#0e7490'],
  ['#1e40af', '#9333ea'],
];

interface Row extends Series {
  /** Name as last saved (used to move products when a series is renamed). */
  savedName: string | null;
}

/** Picture behind one series tile: upload / replace / delete take effect immediately. */
function TilePicture({ slug, name }: { slug: string; name: string }) {
  const { images, refresh } = useSettings();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const url = images.series[slug] ?? null;

  const run = async (fn: () => Promise<void>, done: string) => {
    setBusy(true);
    try {
      await fn();
      await refresh();
      toast.success(done, name);
    } catch (e) {
      toast.error('Picture not changed', friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-ink-700 bg-ink-850">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center px-1 text-center text-[10px] text-ink-500">Colour tile</span>
        )}
        {busy && <span className="absolute inset-0 flex items-center justify-center bg-ink-950/70 text-[10px] text-white">Saving…</span>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          void run(async () => {
            const newUrl = await uploadSiteFile(file, `series/${slug}`);
            await saveSiteImages({ ...images, series: { ...images.series, [slug]: newUrl } });
            await deleteSiteFile(url).catch(() => undefined);
          }, url ? 'Picture replaced' : 'Picture added');
        }}
      />
      <div className="flex flex-col gap-1.5">
        <button type="button" className="btn-secondary px-3 py-1.5 text-xs" disabled={busy} onClick={() => input.current?.click()}>
          {url ? <Upload className="h-3.5 w-3.5" aria-hidden="true" /> : <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />}
          {url ? 'Replace picture' : 'Upload picture'}
        </button>
        {url && (
          <button
            type="button"
            className="btn-ghost px-3 py-1.5 text-xs text-rose-300 hover:text-rose-200"
            disabled={busy}
            onClick={() => {
              if (!window.confirm(`Remove the picture for “${name}”? The colour tile will be shown instead.`)) return;
              void run(async () => {
                const series = { ...images.series };
                delete series[slug];
                await saveSiteImages({ ...images, series });
                await deleteSiteFile(url).catch(() => undefined);
              }, 'Picture removed');
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Remove picture
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminSeries() {
  const { series, homeText, images, refresh } = useSettings();
  const [rows, setRows] = useState<Row[]>([]);
  const [heading, setHeading] = useState({ eyebrow: '', title: '', link: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  // Follow the saved data until the admin starts editing, so unsaved edits are never overwritten
  // (e.g. when uploading a tile picture refreshes the store settings).
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched) return;
    setRows(series.map((s) => ({ ...s, savedName: s.name })));
    setHeading({ eyebrow: homeText.seriesEyebrow, title: homeText.seriesTitle, link: homeText.seriesLink });
  }, [series, homeText, touched]);

  const update = (i: number, patch: Partial<Row>) => {
    setTouched(true);
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  };
  const move = (i: number, dir: -1 | 1) => {
    setTouched(true);
    setRows((r) => {
      const next = [...r];
      const j = i + dir;
      if (j < 0 || j >= next.length) return r;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    if (rows.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Already in the list', name);
      return;
    }
    let slug = slugify(name) || 'series';
    while (rows.some((r) => r.slug === slug)) slug += '-2';
    setTouched(true);
    setRows((r) => [...r, { slug, name, colors: NEW_COLORS[r.length % NEW_COLORS.length], savedName: null }]);
    setNewName('');
  };

  const dirty =
    JSON.stringify(rows.map(({ slug, name, colors }) => ({ slug, name, colors }))) !==
      JSON.stringify(series.map(({ slug, name, colors }) => ({ slug, name, colors }))) ||
    heading.eyebrow !== homeText.seriesEyebrow ||
    heading.title !== homeText.seriesTitle ||
    heading.link !== homeText.seriesLink;

  const save = async () => {
    setError(null);
    const names = rows.map((r) => r.name.trim());
    if (names.some((n) => !n)) return setError('Every series needs a name.');
    if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) return setError('Two series have the same name.');
    setSaving(true);
    try {
      // Keep products in their series when it is renamed.
      for (const r of rows) {
        if (r.savedName && r.savedName !== r.name.trim()) await renameSeriesProducts(r.savedName, r.name.trim());
      }
      await saveSeries(rows.map((r) => ({ slug: r.slug, name: r.name.trim(), colors: r.colors })));
      await saveHomeText({ ...homeText, seriesEyebrow: heading.eyebrow, seriesTitle: heading.title, seriesLink: heading.link });
      // Remove tile pictures of deleted series.
      const kept = new Set(rows.map((r) => r.slug));
      const removed = Object.keys(images.series).filter((slug) => !kept.has(slug));
      if (removed.length) {
        const pics = { ...images.series };
        for (const slug of removed) {
          await deleteSiteFile(pics[slug]).catch(() => undefined);
          delete pics[slug];
        }
        await saveSiteImages({ ...images, series: pics });
      }
      await refresh();
      setTouched(false);
      toast.success('Shop by anime saved', 'Changes are live on the store.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Shop by anime"
        description="The “Your favorite series, on your shelf” section on the home page — also used in the Shop menu, footer and shop filters."
        actions={
          <button type="button" className="btn-primary" disabled={!dirty || saving} onClick={save}>
            <Save className="h-4 w-4" aria-hidden="true" /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      <div className="space-y-6">
        <section className="card grid gap-4 p-5 sm:grid-cols-3">
          <h2 className="text-lg font-semibold sm:col-span-3">Section heading</h2>
          <Field label="Small label">
            <input className="input" value={heading.eyebrow} onChange={(e) => { setTouched(true); setHeading((h) => ({ ...h, eyebrow: e.target.value })); }} />
          </Field>
          <Field label="Heading">
            <input className="input" value={heading.title} onChange={(e) => { setTouched(true); setHeading((h) => ({ ...h, title: e.target.value })); }} />
          </Field>
          <Field label="Link text (top right)">
            <input className="input" value={heading.link} onChange={(e) => { setTouched(true); setHeading((h) => ({ ...h, link: e.target.value })); }} />
          </Field>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Series tiles ({rows.length})</h2>
              <p className="text-xs text-ink-400">
                Rename, reorder or delete, then press <strong className="text-ink-200">Save changes</strong>. Pictures save as soon as you upload them.
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {rows.map((r, i) => (
              <li key={r.slug} className="grid gap-4 rounded-xl border border-ink-700 p-4 lg:grid-cols-[2.5rem_minmax(0,1fr)_auto_auto] lg:items-center">
                <span
                  className="hidden h-10 w-10 items-center justify-center rounded-lg font-display text-sm font-bold text-white lg:flex"
                  style={{ backgroundImage: `linear-gradient(135deg, ${r.colors[0]}, ${r.colors[1]})` }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <label className="label" htmlFor={`series-${r.slug}`}>
                    Name {r.savedName && r.savedName !== r.name.trim() && <span className="text-xs text-amber-300">(was “{r.savedName}”)</span>}
                    {!r.savedName && <span className="text-xs text-emerald-300">(new)</span>}
                  </label>
                  <input id={`series-${r.slug}`} className="input" value={r.name} onChange={(e) => update(i, { name: e.target.value })} />
                  <div className="mt-2 flex items-center gap-2 text-xs text-ink-400">
                    Tile colours
                    <input type="color" aria-label={`${r.name} colour 1`} className="h-7 w-9 cursor-pointer rounded border border-ink-700 bg-transparent" value={r.colors[0]} onChange={(e) => update(i, { colors: [e.target.value, r.colors[1]] })} />
                    <input type="color" aria-label={`${r.name} colour 2`} className="h-7 w-9 cursor-pointer rounded border border-ink-700 bg-transparent" value={r.colors[1]} onChange={(e) => update(i, { colors: [r.colors[0], e.target.value] })} />
                  </div>
                </div>
                <TilePicture slug={r.slug} name={r.name} />
                <div className="flex gap-1.5 lg:flex-col">
                  <button type="button" className="icon-btn border border-ink-700" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${r.name} up`}>
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" className="icon-btn border border-ink-700" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Move ${r.name} down`}>
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={cn('icon-btn border border-rose-500/40 text-rose-300 hover:bg-rose-500/10')}
                    aria-label={`Delete ${r.name}`}
                    onClick={() => {
                      if (window.confirm(`Delete “${r.name}” from Shop by anime? Its products stay in the shop. Press Save changes to apply.`)) {
                        setTouched(true);
                        setRows((rs) => rs.filter((_, j) => j !== i));
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <form
            className="mt-4 flex flex-wrap gap-2 border-t border-ink-800 pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <label htmlFor="new-series" className="sr-only">New series name</label>
            <input id="new-series" className="input max-w-xs" placeholder="New series name, e.g. Chainsaw Man" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <button type="submit" className="btn-secondary" disabled={!newName.trim()}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add series
            </button>
          </form>
        </section>

        <FormAlert message={error} />
        <div className="flex justify-end">
          <button type="button" className="btn-primary" disabled={!dirty || saving} onClick={save}>
            <Save className="h-4 w-4" aria-hidden="true" /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
        <p className="text-xs text-ink-500">
          Tip: to put a product in a series, edit the product and choose the series in its “Anime / series” field.
        </p>
      </div>
    </>
  );
}
