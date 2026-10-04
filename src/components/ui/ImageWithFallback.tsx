import { useEffect, useState, type ImgHTMLAttributes } from 'react';

const FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b1035"/><stop offset="1" stop-color="#0c0c13"/></linearGradient></defs><rect width="400" height="500" fill="url(#g)"/><path d="M150 330V170l100 160V170" fill="none" stroke="#8b5cf6" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" opacity=".6"/><text x="200" y="400" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="18" fill="#8b8ba3">Image unavailable</text></svg>`,
  );

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & { src: string | null | undefined; alt: string };

/** <img> with lazy loading and a branded fallback for missing/broken URLs. */
export function ImageWithFallback({ src, alt, loading = 'lazy', ...rest }: Props) {
  const [current, setCurrent] = useState(src || FALLBACK);
  useEffect(() => setCurrent(src || FALLBACK), [src]);
  return (
    <img
      {...rest}
      src={current}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => {
        if (current !== FALLBACK) setCurrent(FALLBACK);
      }}
    />
  );
}
