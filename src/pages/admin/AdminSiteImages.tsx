import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileImage, ImagePlus, Package, RotateCcw, Upload } from 'lucide-react';
import type { SiteImages } from '@/types';
import { useSettings } from '@/context/SettingsContext';
import { adminListCategories, deleteSiteFile, setCategoryImage, uploadSiteFile } from '@/services/admin';
import { COMMUNITY_SLOTS, saveSiteImages } from '@/services/engagement';
import { communityImagePath, heroFigurePaths, heroImagePath, homeVideoPath, placeholderCategoryPath } from '@/data/seedProducts';
import { useAsync } from '@/hooks/useAsync';
import { friendlyError } from '@/lib/authErrors';
import { toast } from '@/store/toastStore';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { ErrorState, Spinner } from '@/components/ui/States';
import { AdminPageHeader } from './AdminLayout';
import { cn } from '@/lib/cn';
import { HERO_SERIES } from '@/data/series';

/** Series name shown on each hero platform (left, centre, right), e.g. "Sailor Moon". */

/** File name from an image URL, without the upload timestamp prefix (e.g. "1791138836197-banner.png" → "banner.png"). */
function fileName(url: string): string {
  const last = url.split('?')[0].split('/').pop() ?? url;
  let name = last;
  try {
    name = decodeURIComponent(last);
  } catch {
    // keep the raw segment
  }
  return name.replace(/^\d{10,}-/, '');
}

interface SlotProps {
  label: string;
  hint?: string;
  /** What visitors see now (custom upload or the default). */
  preview: string | null;
  /** True when an admin upload is in use (so it can be deleted). */
  custom: boolean;
  kind?: 'image' | 'video';
  aspect?: string;
  /** Shown when there is no preview image. */
  emptyText?: string;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
}

/** One replaceable image (or video) with preview, upload/replace and delete. */
export function Slot({ label, hint, preview, custom, kind = 'image', aspect = 'aspect-[4/5]', emptyText = 'Nothing set', onUpload, onDelete }: SlotProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'upload' | 'delete' | null>(null);

  const run = async (what: 'upload' | 'delete', fn: () => Promise<void>, done: string) => {
    setBusy(what);
    try {
      await fn();
      toast.success(done, label);
    } catch (e) {
      toast.error(what === 'upload' ? 'Upload failed' : 'Could not delete', friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className={cn('relative bg-ink-850', aspect)}>
        {preview ? (
          kind === 'video' ? (
            <video src={preview} className="absolute inset-0 h-full w-full object-cover" muted loop playsInline autoPlay />
          ) : (
            <ImageWithFallback src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pb-6 text-xs text-ink-500">{emptyText}</div>
        )}
        <span
          className={cn(
            'absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            custom ? 'bg-emerald-400/90 text-ink-950' : 'bg-ink-950/80 text-ink-300',
          )}
        >
          {custom ? 'Your upload' : 'Default'}
        </span>
        <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink-950/95 to-ink-950/0 px-2.5 pb-1.5 pt-5 text-xs font-semibold text-white">
          {label}
        </span>
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-ink-950/70 text-sm text-white">{busy === 'upload' ? 'Uploading…' : 'Deleting…'}</div>}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
          {preview && (
            <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-ink-300" title={fileName(preview)}>
              <FileImage className="h-3.5 w-3.5 shrink-0 text-pulse-400" aria-hidden="true" />
              <span className="truncate">{fileName(preview)}</span>
              {!custom && <span className="shrink-0 text-ink-500">(default)</span>}
            </p>
          )}
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept={kind === 'video' ? 'video/mp4,video/webm' : 'image/*'}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void run('upload', () => onUpload(file), custom ? 'Image replaced' : 'Image added');
            }}
          />
          <button type="button" className="btn-primary flex-1 px-3 py-2" disabled={busy !== null} onClick={() => input.current?.click()}>
            {custom ? <Upload className="h-4 w-4" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
            {custom ? 'Replace' : 'Upload'}
          </button>
          {custom && (
            <button
              type="button"
              className="btn-danger px-3 py-2"
              disabled={busy !== null}
              onClick={() => {
                if (window.confirm(`Delete your ${kind} for “${label}”? The default will be shown instead.`)) {
                  void run('delete', onDelete, 'Deleted — default restored');
                }
              }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-ink-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

type SingleKey = Exclude<keyof SiteImages, 'community' | 'series'>;

export default function AdminSiteImages() {
  const { images, refresh, series } = useSettings();
  const heroName = (i: number) => series.find((x) => x.slug === HERO_SERIES[i])?.name ?? ['Left', 'Centre', 'Right'][i];
  const categories = useAsync(adminListCategories, []);
  const defaultFigures = heroFigurePaths();

  /** Upload a file into one slot, save, then remove the file it replaced. */
  const setSingle = (key: SingleKey, kind: 'image' | 'video' = 'image') => async (file: File) => {
    const url = await uploadSiteFile(file, key, kind);
    const old = images[key];
    await saveSiteImages({ ...images, [key]: url });
    await deleteSiteFile(old).catch(() => undefined);
    await refresh();
  };
  const clearSingle = (key: SingleKey) => async () => {
    const old = images[key];
    await saveSiteImages({ ...images, [key]: null });
    await deleteSiteFile(old).catch(() => undefined);
    await refresh();
  };
  const setCommunity = (i: number) => async (file: File) => {
    const url = await uploadSiteFile(file, 'community');
    const old = images.community[i];
    const community = [...images.community];
    community[i] = url;
    await saveSiteImages({ ...images, community });
    await deleteSiteFile(old).catch(() => undefined);
    await refresh();
  };
  const clearCommunity = (i: number) => async () => {
    const old = images.community[i];
    const community = [...images.community];
    community[i] = null;
    await saveSiteImages({ ...images, community });
    await deleteSiteFile(old).catch(() => undefined);
    await refresh();
  };

  const isUpload = (url: string | null) => Boolean(url && url.includes('/storage/v1/object/public/site-images/'));

  return (
    <>
      <AdminPageHeader
        title="Site images"
        description="Add, replace or delete the images shown across the store. Changes go live immediately on every device."
      />

      <div className="space-y-12">
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="flex items-center gap-2 text-sm text-ink-300">
            <Package className="h-4 w-4 text-pulse-400" aria-hidden="true" />
            Product photos (shop, product pages, cart, search) are managed per product.
          </p>
          <Link to="/admin/products" className="btn-secondary px-3 py-2">Manage product photos</Link>
        </div>

        <Section title="Logo & browser icon" description="The logo appears in the header, footer, sign-in pages and admin. Use a transparent PNG or SVG, ideally wide (about 4:1). The browser icon shows on the tab — a square image works best.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Slot label="Store logo" hint="Replaces the built-in N logo" aspect="aspect-[5/2]" preview={images.logo} emptyText="Built-in logo in use" custom={!!images.logo} onUpload={setSingle('logo')} onDelete={clearSingle('logo')} />
            <Slot label="Browser-tab icon" hint="Square, e.g. 512 × 512" aspect="aspect-square" preview={images.favicon ?? '/favicon.svg'} custom={!!images.favicon} onUpload={setSingle('favicon')} onDelete={clearSingle('favicon')} />
          </div>
        </Section>

        <Section
          title="Home page — hero banner"
          description="The large picture beside the headline. Use either one full banner image, or three figure photos on the glowing platforms (transparent PNG cut-outs look best). If any figure photo is set, the platforms are shown instead of the banner image."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Slot label="Banner image" hint="Wide image, about 6:5" aspect="aspect-[6/5]" preview={images.hero ?? heroImagePath()} custom={!!images.hero} onUpload={setSingle('hero')} onDelete={clearSingle('hero')} />
            <Slot label="Platforms background" hint="Purple stage behind the 3 series figures" aspect="aspect-[6/5]" preview={images.heroStage ?? '/images/hero/hero-stage.svg'} custom={!!images.heroStage} onUpload={setSingle('heroStage')} onDelete={clearSingle('heroStage')} />
            <Slot label={`${heroName(0)} figure`} hint="Left platform on the home banner" preview={images.heroLeft ?? defaultFigures.left} custom={!!images.heroLeft} onUpload={setSingle('heroLeft')} onDelete={clearSingle('heroLeft')} />
            <Slot label={`${heroName(1)} figure`} hint="Centre platform (largest) on the home banner" preview={images.heroCenter ?? defaultFigures.center} custom={!!images.heroCenter} onUpload={setSingle('heroCenter')} onDelete={clearSingle('heroCenter')} />
            <Slot label={`${heroName(2)} figure`} hint="Right platform on the home banner" preview={images.heroRight ?? defaultFigures.right} custom={!!images.heroRight} onUpload={setSingle('heroRight')} onDelete={clearSingle('heroRight')} />
          </div>
        </Section>

        <Section title="Home page — background video" description="Optional looping video behind the hero. MP4 or WebM, up to 50 MB; short, dark clips work best.">
          <div className="max-w-sm">
            <Slot
              label="Background video"
              kind="video"
              aspect="aspect-video"
              preview={images.homeVideo ?? homeVideoPath()}
              custom={!!images.homeVideo}
              onUpload={setSingle('homeVideo', 'video')}
              onDelete={clearSingle('homeVideo')}
            />
          </div>
        </Section>

        <Section title="Home page — Shop by anime" description="Series names, order and tile pictures are managed on their own page.">
          <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-ink-300">Rename, add, delete or reorder series and upload a picture for each tile.</p>
            <Link to="/admin/series" className="btn-secondary">Open Shop by anime</Link>
          </div>
        </Section>

        <Section title="Category tiles" description="Shown in “Find your corner of the haven” on the home page and on each category page.">
          {categories.error ? (
            <ErrorState error={categories.error} onRetry={categories.reload} />
          ) : !categories.data ? (
            <Spinner />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {categories.data.map((c) => {
                const fallback = placeholderCategoryPath(c.slug);
                return (
                  <Slot
                    key={c.id}
                    label={c.name}
                    preview={c.imageUrl ?? fallback}
                    custom={isUpload(c.imageUrl)}
                    onUpload={async (file) => {
                      const url = await uploadSiteFile(file, `categories/${c.slug}`);
                      await setCategoryImage(c.id, url);
                      if (isUpload(c.imageUrl)) await deleteSiteFile(c.imageUrl).catch(() => undefined);
                      categories.reload();
                    }}
                    onDelete={async () => {
                      await setCategoryImage(c.id, fallback);
                      await deleteSiteFile(c.imageUrl).catch(() => undefined);
                      categories.reload();
                    }}
                  />
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Home page — community gallery" description="The 8 square photos in “From the community”.">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: COMMUNITY_SLOTS }, (_, i) => (
              <Slot
                key={i}
                label={`Photo ${i + 1}`}
                aspect="aspect-square"
                preview={images.community[i] ?? communityImagePath(i)}
                custom={!!images.community[i]}
                onUpload={setCommunity(i)}
                onDelete={clearCommunity(i)}
              />
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}
