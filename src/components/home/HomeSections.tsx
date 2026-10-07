import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CalendarClock, Gift, PackageCheck, Sparkles } from 'lucide-react';
import type { Category } from '@/types';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Skeleton } from '@/components/ui/States';
import { NewsletterForm } from '@/components/layout/NewsletterForm';
import { communityImagePath, heroFigurePaths, heroImagePath, homeVideoPath } from '@/data/seedProducts';
import { ANIME_SERIES, HERO_SERIES, seriesHref } from '@/data/series';
import { useSettings } from '@/context/SettingsContext';

export function SectionHeading({ eyebrow, title, action, id }: { eyebrow?: string; title: string; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 id={id} tabIndex={id ? -1 : undefined} className="text-2xl font-bold outline-none sm:text-3xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

/** Home images: admin-chosen (Admin → Site images) or the built-in defaults. */
function useHomeImages() {
  const { images } = useSettings();
  const defaults = heroFigurePaths();
  return {
    hero: images.hero ?? heroImagePath(),
    heroStage: images.heroStage ?? '/images/hero/hero-stage.svg',
    figures: {
      left: images.heroLeft ?? defaults.left,
      center: images.heroCenter ?? defaults.center,
      right: images.heroRight ?? defaults.right,
    },
    homeVideo: images.homeVideo ?? homeVideoPath(),
    community: (i: number) => images.community[i] ?? communityImagePath(i),
  };
}

export function Hero() {
  const home = useHomeImages();
  return (
    <section className="relative overflow-hidden border-b border-ink-800" aria-labelledby="hero-heading">
      <HeroBackgroundVideo />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,.25),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,.12),transparent_50%)]" />
      <div className="container-page relative grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div className="max-w-xl">
          <p className="chip mb-6 border-nova-500/40 bg-nova-500/10 text-nova-200">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Autumn drops are live
          </p>
          <h1 id="hero-heading" className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
            Ultimate Anime <span className="text-gradient">Destination</span>
          </h1>
          <p className="mt-6 text-lg text-ink-300">Discover the latest releases, trending.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop?sort=newest" className="btn-primary px-6 py-3 text-base">
              Shop New Arrivals <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#collections"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' });
                document.getElementById('collections-heading')?.focus({ preventScroll: true });
              }}
              className="btn-secondary px-6 py-3 text-base"
            >
              Explore Collections
            </a>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-ink-800 pt-6">
            {[
              ['38+', 'Original pieces'],
              ['7', 'Studio partners'],
              ['$200', 'Free-ship threshold'],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-2xl font-bold text-white">{v}</dd>
                <dd className="text-xs text-ink-400">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-nova-600/30 via-transparent to-pulse-400/20 blur-2xl" aria-hidden="true" />
          {Object.values(home.figures).some(Boolean) ? (
            <HeroStage figures={home.figures} stage={home.heroStage} />
          ) : (
            <ImageWithFallback
              src={home.hero}
              alt="Display stage with three glowing platforms"
              loading="eager"
              className="relative aspect-[6/5] w-full rounded-[2rem] border border-ink-700 object-cover shadow-2xl"
            />
          )}
          <div className="absolute -bottom-4 left-4 right-4 rounded-2xl border border-ink-700 bg-ink-900/90 px-4 py-3 shadow-xl backdrop-blur sm:left-8 sm:right-auto">
            <p className="text-xs text-ink-400">Featured series</p>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {HERO_SERIES.map((slug) => {
                const s = ANIME_SERIES.find((x) => x.slug === slug);
                return s ? (
                  <li key={slug}>
                    <Link to={seriesHref(s)} className="text-sm font-semibold text-white hover:text-nova-200">
                      {s.name}
                    </Link>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoryGrid({ categories, loading }: { categories?: Category[]; loading: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
      {loading
        ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />)
        : categories?.map((c, i) => (
            <Link
              key={c.id}
              to={`/category/${c.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-ink-800 transition hover:border-nova-400/60"
            >
              <ImageWithFallback
                src={c.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-pulse-400">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-1 text-base font-bold sm:text-lg">{c.name}</h3>
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-ink-300 group-hover:text-white">
                  Browse <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
    </div>
  );
}

export function PromoSplit() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950 via-ink-900 to-ink-950 p-8 sm:p-10">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden="true" />
        <CalendarClock className="h-8 w-8 text-indigo-300" aria-hidden="true" />
        <h3 className="mt-5 text-2xl font-bold sm:text-3xl">Preorder without the anxiety</h3>
        <p className="mt-3 max-w-md text-ink-300">
          Lock in your allocation today. Cancel any preorder before it ships, and we’ll keep you posted on every production update.
        </p>
        <Link to="/category/preorders" className="btn-primary mt-6">
          See upcoming releases
        </Link>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-950/60 via-ink-900 to-ink-950 p-8 sm:p-10">
        <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" aria-hidden="true" />
        <Gift className="h-8 w-8 text-amber-300" aria-hidden="true" />
        <h3 className="mt-5 text-2xl font-bold sm:text-3xl">Limited runs, numbered certificates</h3>
        <p className="mt-3 max-w-md text-ink-300">
          Vault exclusives and small-batch dioramas that won’t be produced again. When they’re gone, they’re gone.
        </p>
        <Link to="/category/limited-editions" className="btn mt-6 bg-amber-300 text-ink-950 hover:bg-amber-200">
          Shop limited editions
        </Link>
      </div>
    </div>
  );
}

const BENEFITS = [
  { icon: BadgeCheck, title: 'Original designs only', text: 'Every character and sculpt in our shop is an original creation — no knock-offs.' },
  { icon: PackageCheck, title: 'Collector-grade packing', text: 'Double-boxed with foam corners so boxes arrive shelf-ready.' },
  { icon: CalendarClock, title: 'Fair preorders', text: 'Clear release windows and status updates from order to doorstep.' },
  { icon: Gift, title: 'Members get more', text: 'Drop alerts, early access and promo codes for newsletter subscribers.' },
];

export function Benefits() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {BENEFITS.map(({ icon: Icon, title, text }) => (
        <li key={title} className="card p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-nova-500/20 to-pulse-400/20 text-pulse-300">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-base font-semibold">{title}</h3>
          <p className="mt-1.5 text-sm text-ink-400">{text}</p>
        </li>
      ))}
    </ul>
  );
}

export function NewsletterSection() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-nova-500/30 bg-gradient-to-r from-nova-700/40 via-ink-900 to-ink-900 p-8 sm:p-12">
      <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-nova-500/25 blur-3xl" aria-hidden="true" />
      <div className="relative grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="eyebrow">The Vault Dispatch</p>
          <h2 className="mt-2 text-3xl font-bold">Never miss a preorder window again.</h2>
          <p className="mt-3 text-ink-300">One email when something drops. Subscribers get first dibs on limited runs.</p>
        </div>
        <NewsletterForm source="home" />
      </div>
    </div>
  );
}

const HANDLES = ['@shelfof_stars', '@neonronin_fan', '@petalknight.club', '@abyssal.archive', '@minimaxi', '@ember.display', '@vitrine.vibes', '@clockwork.corner'];

export function CommunityStrip() {
  const home = useHomeImages();
  return (
    <div>
      <ul className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-8">
        {HANDLES.map((h, i) => (
          <li key={h} className="group relative w-40 shrink-0 snap-start overflow-hidden rounded-2xl sm:w-auto">
            <ImageWithFallback src={home.community(i)} alt={`Community shelf photo shared by ${h}`} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-110" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent px-3 pb-2 pt-6 text-[11px] font-medium text-ink-200">{h}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-xs text-ink-500">Community gallery uses placeholder artwork. Tag #FigureHaven to be featured.</p>
    </div>
  );
}

/** "Shop by anime" tiles — typographic designs only (no character artwork). */
export function AnimeSeriesGrid() {
  const { images } = useSettings();
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {ANIME_SERIES.map((s, i) => (
        <li key={s.slug}>
          <Link
            to={seriesHref(s)}
            className="group relative flex h-28 items-end overflow-hidden rounded-2xl border border-ink-800 p-4 transition hover:-translate-y-0.5 hover:border-nova-400/60 sm:h-32"
            style={{ backgroundImage: `linear-gradient(135deg, ${s.colors[0]}, #0c0c13 70%), radial-gradient(circle at 85% 15%, ${s.colors[1]}, transparent 55%)` }}
          >
            {images.series[s.slug] && (
              <>
                <img src={images.series[s.slug]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/40 to-transparent" aria-hidden="true" />
              </>
            )}
            <span
              className="pointer-events-none absolute -right-2 -top-3 font-display text-7xl font-extrabold text-white/5 transition group-hover:text-white/10"
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="relative">
              <span className="block font-display text-base font-bold text-white sm:text-lg">{s.name}</span>
              <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-300 group-hover:text-white">
                Shop figures <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Hero stage with real figure photos standing on the three platforms of
 * /images/hero/hero-stage.svg. Positions are percentages of that 1200×1000 artwork.
 * Transparent PNG cut-outs (photos/hero-left.png etc.) give the cleanest result.
 */
const HERO_SLOTS = [
  { key: 'left', x: 24.2, base: 79.5, width: 23, z: 1 },
  { key: 'right', x: 77.5, base: 79.5, width: 21, z: 1 },
  { key: 'center', x: 50, base: 83.5, width: 31, z: 2 },
] as const;

function HeroStage({ figures, stage }: { figures: { left: string | null; center: string | null; right: string | null }; stage: string }) {
  return (
    <div className="relative aspect-[6/5] w-full overflow-hidden rounded-[2rem] border border-ink-700 shadow-2xl">
      <img src={stage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {HERO_SLOTS.map(({ key, x, base, width, z }) => {
        const src = figures[key];
        if (!src) return null;
        const style = { left: `${x}%`, width: `${width}%`, zIndex: z };
        return (
          <div key={key}>
            {/* Contact shadow on the platform */}
            <div
              className="absolute -translate-x-1/2 rounded-[50%] bg-black/70 blur-md"
              style={{ ...style, top: `${base - 1.5}%`, height: '3%' }}
              aria-hidden="true"
            />
            {/* Figure with purple-blue rim light */}
            <img
              src={src}
              alt=""
              className="absolute max-h-[62%] -translate-x-1/2 object-contain object-bottom"
              style={{
                ...style,
                bottom: `${100 - base}%`,
                filter:
                  'drop-shadow(0 0 1px rgba(196,181,253,.9)) drop-shadow(-6px -2px 10px rgba(139,92,246,.45)) drop-shadow(6px -2px 10px rgba(34,211,238,.35))',
              }}
            />
            {/* Soft reflection on the platform surface */}
            <img
              src={src}
              alt=""
              aria-hidden="true"
              className="absolute max-h-[62%] -translate-x-1/2 -scale-y-100 object-contain object-bottom opacity-25"
              style={{
                ...style,
                top: `${base}%`,
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,.6), transparent 18%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,.6), transparent 18%)',
              }}
            />
          </div>
        );
      })}
      <span className="sr-only">Featured collectible figures displayed on glowing platforms</span>
    </div>
  );
}

/**
 * Looping, muted background video behind the home hero (photos/home-video.mp4).
 * A dark purple overlay keeps text readable; paused for reduced-motion users.
 */
function HeroBackgroundVideo() {
  const src = useHomeImages().homeVideo;
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      if (reduce.matches) video.pause();
      else void video.play().catch(() => undefined);
    };
    apply();
    reduce.addEventListener('change', apply);
    return () => reduce.removeEventListener('change', apply);
  }, [src]);
  if (!src) return null;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <video ref={ref} src={src} className="h-full w-full object-cover" autoPlay muted loop playsInline preload="auto" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/70 to-ink-950/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-nova-700/20" />
    </div>
  );
}
