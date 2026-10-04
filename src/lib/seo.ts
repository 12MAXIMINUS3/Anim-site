import { useEffect } from 'react';

const SITE_NAME = 'Nova Figure Vault';
const DEFAULT_DESCRIPTION =
  'Nova Figure Vault: scale figures, statues, chibi minis, action figures, preorders and display gear for serious collectors.';

interface SeoOptions {
  title?: string;
  description?: string;
  image?: string;
  /** Structured data (JSON-LD) object injected into <head>. */
  jsonLd?: Record<string, unknown> | null;
  noIndex?: boolean;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

export function useSeo({ title, description, image, jsonLd, noIndex }: SeoOptions) {
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Premium Collectible Figures`;
    const desc = description || DEFAULT_DESCRIPTION;
    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', window.location.href);
    if (image) setMeta('property', 'og:image', new URL(image, window.location.origin).href);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'robots', noIndex ? 'noindex,nofollow' : 'index,follow');
    setCanonical(window.location.origin + window.location.pathname);
  }, [title, description, image, noIndex]);

  useEffect(() => {
    if (!jsonLdString) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.seo = 'page';
    script.text = jsonLdString;
    document.head.appendChild(script);
    return () => script.remove();
  }, [jsonLdString]);
}
