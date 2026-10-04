import { useState, type MouseEvent } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import type { ProductImage } from '@/types';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Dialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/cn';

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const list = images.length ? images : [{ id: 'none', url: '', alt: name, position: 0, storagePath: null }];
  const current = list[Math.min(index, list.length - 1)];
  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + list.length) % list.length);

  const onMove = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {list.length > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto md:w-20 md:flex-col">
          {list.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1} of ${list.length}`}
              aria-current={i === index ? 'true' : undefined}
              className={cn(
                'aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-xl border-2 transition md:w-full',
                i === index ? 'border-nova-400' : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <ImageWithFallback src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="relative aspect-[4/5] flex-1 self-start">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          onMouseMove={onMove}
          onMouseLeave={() => setZoom(null)}
          className="group absolute inset-0 block h-full w-full cursor-zoom-in overflow-hidden rounded-2xl border border-ink-800 bg-ink-850"
          aria-label={`Open full-size image: ${current.alt || name}`}
        >
          <ImageWithFallback
            src={current.url}
            alt={current.alt || name}
            loading="eager"
            className="h-full w-full object-cover transition-transform duration-200"
            style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
          <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-ink-950/70 px-3 py-1.5 text-xs text-ink-200 backdrop-blur">
            <Expand className="h-3.5 w-3.5" aria-hidden="true" /> Zoom
          </span>
        </button>
        {list.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="icon-btn absolute left-3 top-1/2 -translate-y-1/2 bg-ink-950/60 backdrop-blur" aria-label="Previous image">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(1)} className="icon-btn absolute right-3 top-1/2 -translate-y-1/2 bg-ink-950/60 backdrop-blur" aria-label="Next image">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      <Dialog open={lightbox} onClose={() => setLightbox(false)} title={`${name} — image ${index + 1} of ${list.length}`} size="xl">
        <div
          className="relative"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
          }}
        >
          <ImageWithFallback src={current.url} alt={current.alt || name} className="mx-auto max-h-[75vh] w-auto rounded-xl object-contain" />
          {list.length > 1 && (
            <div className="mt-4 flex justify-center gap-3">
              <button type="button" className="btn-secondary" onClick={() => go(-1)}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
              </button>
              <button type="button" className="btn-secondary" onClick={() => go(1)}>
                Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
