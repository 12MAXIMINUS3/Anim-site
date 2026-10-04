import { useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Link2, Trash2, Upload } from 'lucide-react';
import type { ProductImage } from '@/types';
import { addImageByUrl, deleteImage, updateImage, uploadProductImage } from '@/services/admin';
import { friendlyError } from '@/lib/authErrors';
import { toast } from '@/store/toastStore';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

interface Props {
  productId: string;
  productName: string;
  images: ProductImage[];
  onChange: () => void;
}

/** Upload, re-order, edit alt text and delete product images (Supabase Storage + product_images). */
export function ProductImagesManager({ productId, productName, images, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [alts, setAlts] = useState<Record<string, string>>({});

  const run = async (fn: () => Promise<void>, success?: string) => {
    setBusy(true);
    try {
      await fn();
      if (success) toast.success(success);
      onChange();
    } catch (e) {
      toast.error('Image update failed', friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    await run(async () => {
      for (const [i, file] of [...files].entries()) {
        await uploadProductImage(productId, file, `${productName} — image ${images.length + i + 1}`);
      }
    }, `${files.length} image${files.length === 1 ? '' : 's'} uploaded`);
    if (fileRef.current) fileRef.current.value = '';
  };

  const move = (index: number, dir: -1 | 1) => {
    const a = images[index];
    const b = images[index + dir];
    if (!a || !b) return;
    void run(async () => {
      await updateImage(a.id, { position: b.position });
      await updateImage(b.id, { position: a.position === b.position ? a.position + dir : a.position });
    });
  };

  const addUrl = (e: FormEvent) => {
    e.preventDefault();
    const value = url.trim();
    if (!/^(https?:\/\/|\/)/.test(value)) {
      toast.error('Invalid URL', 'Use an absolute https:// URL or a site-relative path like /images/x.png');
      return;
    }
    void run(async () => {
      await addImageByUrl(productId, value, productName);
      setUrl('');
    }, 'Image added');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          multiple
          className="sr-only"
          id="image-upload"
          onChange={(e) => onFiles(e.target.files)}
        />
        <label htmlFor="image-upload" className="btn-primary cursor-pointer" aria-disabled={busy}>
          <Upload className="h-4 w-4" aria-hidden="true" /> {busy ? 'Working…' : 'Upload images'}
        </label>
        <form onSubmit={addUrl} className="flex min-w-[260px] flex-1 gap-2">
          <label htmlFor="image-url" className="sr-only">Image URL</label>
          <input id="image-url" className="input" placeholder="…or paste an image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="submit" className="btn-secondary" disabled={busy || !url.trim()}>
            <Link2 className="h-4 w-4" aria-hidden="true" /> Add
          </button>
        </form>
      </div>
      <p className="text-xs text-ink-400">PNG, JPG, WebP, GIF or SVG up to 5 MB. The first image is the primary image on product cards.</p>

      {images.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-600 py-10 text-center text-sm text-ink-400">
          <ImagePlus className="mb-2 h-8 w-8 text-nova-400" aria-hidden="true" />
          No images yet. A branded placeholder is shown on the storefront until you add one.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((img, i) => (
            <li key={img.id} className="card overflow-hidden">
              <div className="relative">
                <ImageWithFallback src={img.url} alt={img.alt} className="aspect-[4/5] w-full object-cover" />
                {i === 0 && <span className="absolute left-2 top-2 rounded-md bg-nova-500 px-2 py-0.5 text-xs font-semibold text-white">Primary</span>}
              </div>
              <div className="space-y-2 p-3">
                <label className="label text-xs" htmlFor={`alt-${img.id}`}>Alt text</label>
                <input
                  id={`alt-${img.id}`}
                  className="input py-2 text-xs"
                  value={alts[img.id] ?? img.alt}
                  onChange={(e) => setAlts((a) => ({ ...a, [img.id]: e.target.value }))}
                  onBlur={() => {
                    const next = (alts[img.id] ?? img.alt).trim();
                    if (next !== img.alt) void run(() => updateImage(img.id, { alt: next || productName }), 'Alt text saved');
                  }}
                />
                <div className="flex justify-between">
                  <div className="flex gap-1">
                    <button type="button" className="icon-btn h-8 w-8" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="Move image earlier">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" className="icon-btn h-8 w-8" disabled={busy || i === images.length - 1} onClick={() => move(i, 1)} aria-label="Move image later">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="icon-btn h-8 w-8 hover:text-rose-300"
                    disabled={busy}
                    aria-label="Delete image"
                    onClick={() => {
                      if (window.confirm('Delete this image?')) void run(() => deleteImage(img), 'Image deleted');
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
