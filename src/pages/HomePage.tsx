import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { catalog, makeQuery } from '@/services/catalog';
import { useAsync } from '@/hooks/useAsync';
import { useSeo } from '@/lib/seo';
import { useSettings } from '@/context/SettingsContext';
import { ProductRail } from '@/components/product/ProductRail';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ErrorState } from '@/components/ui/States';
import {
  AnimeSeriesGrid,
  Benefits,
  CategoryGrid,
  CommunityStrip,
  Hero,
  NewsletterSection,
  PromoSplit,
  SectionHeading,
} from '@/components/home/HomeSections';

const viewAll = (to: string, label: string) => (
  <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-nova-300 hover:text-pulse-300">
    {label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
  </Link>
);

export default function HomePage() {
  useSeo({
    description: 'Original scale figures, statues, chibi minis and display cases. Preorders, limited editions and collector-grade packing.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: 'Figure Haven',
      url: window.location.origin,
      description: 'Demo collectible-figures storefront with original, fictional products.',
    },
  });

  const { homeText } = useSettings();
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) return;
    const t = window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 150);
    return () => window.clearTimeout(t);
  }, [location.hash]);

  const categories = useAsync(() => catalog.listCategories(), []);
  const newest = useAsync(() => catalog.queryProducts(makeQuery({ sort: 'newest', pageSize: 10 })), []);
  const featured = useAsync(() => catalog.queryProducts(makeQuery({ featured: true, pageSize: 8 })), []);
  const best = useAsync(() => catalog.queryProducts(makeQuery({ sort: 'best_selling', availability: 'in_stock', pageSize: 8 })), []);

  return (
    <>
      <Hero />

      <div className="container-page space-y-24 py-16">
        <section aria-labelledby="anime-heading" id="anime" className="scroll-mt-28">
          <SectionHeading id="anime-heading" eyebrow={homeText.seriesEyebrow} title={homeText.seriesTitle} action={viewAll('/shop', homeText.seriesLink)} />
          <AnimeSeriesGrid />
        </section>

        <section aria-labelledby="collections-heading" id="collections" className="scroll-mt-28">
          <SectionHeading id="collections-heading" eyebrow="Collections" title="Find your corner of the haven" action={viewAll('/shop', 'Shop everything')} />
          {categories.error ? (
            <ErrorState error={categories.error} onRetry={categories.reload} />
          ) : (
            <CategoryGrid categories={categories.data} loading={categories.loading} />
          )}
        </section>

        <section aria-labelledby="new-heading">
          <SectionHeading id="new-heading" eyebrow="Just landed" title="New arrivals" action={viewAll('/shop?sort=newest', 'View all new')} />
          {newest.error ? <ErrorState error={newest.error} onRetry={newest.reload} /> : <ProductRail label="New arrivals" products={newest.data?.items} loading={newest.loading} />}
        </section>

        <section aria-labelledby="featured-heading">
          <SectionHeading id="featured-heading" eyebrow="Curator’s picks" title="Featured collectibles" />
          {featured.error ? <ErrorState error={featured.error} onRetry={featured.reload} /> : <ProductGrid products={featured.data?.items} loading={featured.loading} />}
        </section>

        <section aria-label="Promotions">
          <PromoSplit />
        </section>

        <section aria-labelledby="why-heading">
          <SectionHeading id="why-heading" eyebrow="Why shop with us" title="Built by collectors, for collectors" />
          <Benefits />
        </section>

        <section aria-labelledby="best-heading">
          <SectionHeading id="best-heading" eyebrow="Fan favorites" title="Best sellers" action={viewAll('/shop', 'Shop all')} />
          {best.error ? <ErrorState error={best.error} onRetry={best.reload} /> : <ProductGrid products={best.data?.items} loading={best.loading} />}
        </section>

        <section aria-label="Newsletter">
          <NewsletterSection />
        </section>

        <section aria-labelledby="community-heading">
          <SectionHeading id="community-heading" eyebrow="#FigureHaven" title="From the community" />
          <CommunityStrip />
        </section>
      </div>
    </>
  );
}
