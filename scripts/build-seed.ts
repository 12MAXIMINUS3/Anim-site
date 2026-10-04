/**
 * Generates:
 *   - supabase/seed.sql                      (categories, brands, products, images, variants, reviews, settings)
 *   - public/images/products/<slug>-{1,2}.svg (original placeholder product art)
 *   - public/images/categories/<slug>.svg
 *   - public/images/hero/*.svg, public/images/community/*.svg
 *
 * Source of truth: src/data/seedProducts.ts
 * Run with: npm run seed:generate
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  categoryImagePath,
  placeholderCategoryPath,
  placeholderProductPath,
  productImagePaths,
  seedBrands,
  seedCategories,
  seedProducts,
  seedSettings,
  type SeedProduct,
} from '../src/data/seedProducts.ts';
import { drawFigure, type DrawOptions } from './figure-art.ts';
import { ANIME_SERIES, HERO_SERIES } from '../src/data/series.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = (rel: string, content: string) => {
  const file = resolve(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content, 'utf8');
};

// ─────────────────────────────── SVG artwork ───────────────────────────────

type Kind = 'figure' | 'statue' | 'chibi' | 'action' | 'case' | 'accessory';

const PALETTES: Array<[string, string, string]> = [
  ['#150c2e', '#8b5cf6', '#22d3ee'],
  ['#0d1330', '#6366f1', '#f0abfc'],
  ['#1c0a24', '#d946ef', '#a78bfa'],
  ['#061c26', '#22d3ee', '#818cf8'],
  ['#1e1206', '#f59e0b', '#f472b6'],
  ['#071a14', '#34d399', '#a78bfa'],
  ['#120c26', '#a78bfa', '#fde68a'],
];

const FRANCHISE_PALETTE: Record<string, number> = {
  'Starfall Requiem': 0,
  'Neon Ronin Chronicles': 3,
  'Petal Knight Academy': 2,
  'Abyssal Tide': 1,
  'Clockwork Sky': 4,
  'Emberheart Saga': 4,
  'Vault Originals': 6,
};

const KIND_BY_CATEGORY: Record<string, Kind> = {
  'anime-figures': 'figure',
  statues: 'statue',
  'chibi-minis': 'chibi',
  'action-figures': 'action',
  preorders: 'figure',
  'limited-editions': 'statue',
  'display-cases': 'case',
  accessories: 'accessory',
};

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string) {
  let s = hash(seed) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');


/** A stylized figure group drawn in an 800×1000 coordinate space. */
function figureGroup(kind: Kind, seed: string, pal: [string, string, string], id: string, opts: DrawOptions = {}): string {
  if (kind === 'figure' || kind === 'statue' || kind === 'chibi' || kind === 'action') {
    const fig = drawFigure(kind, seed, id, pal[2], opts);
    return `<defs>${fig.defs}</defs>${fig.art}`;
  }
  const r = rng(seed);
  const [, c1, c2] = pal;
  const particles = Array.from({ length: 14 }, () => {
    const x = 120 + r() * 560;
    const y = 140 + r() * 560;
    const size = 2 + r() * 5;
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${size.toFixed(1)}" fill="${c2}" opacity="${(0.35 + r() * 0.6).toFixed(2)}"/>`;
  }).join('');
  const pedestal = `
    <ellipse cx="400" cy="858" rx="230" ry="44" fill="#000" opacity=".45"/>
    <rect x="190" y="800" width="420" height="52" rx="10" fill="url(#${id}-base)"/>
    <ellipse cx="400" cy="800" rx="210" ry="34" fill="#2a2440" stroke="${c2}" stroke-opacity=".5" stroke-width="2"/>`;

  if (kind === 'case') {
    const shelfFigures = [0, 1, 2]
      .map((row) =>
        [0, 1, 2]
          .map((col) => {
            const x = 300 + col * 100;
            const y = 330 + row * 170;
            const h = 50 + r() * 40;
            return `<ellipse cx="${x}" cy="${y + 60}" rx="30" ry="6" fill="#000" opacity=".4"/>
              <path d="M${x} ${y + 60 - h} q -26 ${h * 0.6} -22 ${h} h 44 q 4 ${-h * 0.4} -22 ${-h}z" fill="${col % 2 ? c1 : c2}" opacity=".85"/>
              <circle cx="${x}" cy="${y + 60 - h - 12}" r="14" fill="#ede9fe"/>`;
          })
          .join(''),
      )
      .join('');
    return `<g>
      <rect x="220" y="170" width="360" height="640" rx="14" fill="${c1}" fill-opacity=".08" stroke="#e0e7ff" stroke-opacity=".55" stroke-width="4"/>
      <rect x="236" y="186" width="40" height="608" fill="#fff" opacity=".06"/>
      ${[390, 560].map((y) => `<rect x="226" y="${y}" width="348" height="8" fill="#e0e7ff" opacity=".35"/>`).join('')}
      ${shelfFigures}
      <rect x="200" y="806" width="400" height="40" rx="8" fill="#15121f" stroke="${c2}" stroke-width="2"/>
      <rect x="230" y="822" width="340" height="6" rx="3" fill="${c2}" opacity=".9"/>
      <ellipse cx="400" cy="826" rx="220" ry="20" fill="${c2}" opacity=".18"/>
    </g>`;
  }

  if (kind === 'accessory') {
    const rods = [0, 1, 2]
      .map((i) => {
        const x = 260 + i * 140;
        const h = 220 + r() * 220;
        return `<ellipse cx="${x}" cy="790" rx="62" ry="14" fill="#e0e7ff" opacity=".25" stroke="#e0e7ff" stroke-opacity=".6" stroke-width="3"/>
          <path d="M${x} 790 L${x} ${790 - h * 0.55} L${x + 30} ${790 - h}" stroke="#e0e7ff" stroke-opacity=".75" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="${x}" cy="${790 - h * 0.55}" r="12" fill="${c1}"/>
          <rect x="${x + 18}" y="${790 - h - 18}" width="34" height="22" rx="6" fill="${c2}"/>`;
      })
      .join('');
    return `<g>
      <circle cx="400" cy="470" r="240" fill="${c1}" opacity=".12"/>
      ${rods}
      <rect x="170" y="808" width="460" height="16" rx="8" fill="${c2}" opacity=".35"/>
      ${particles}
    </g>`;
  }

  const hairLen = 120 + r() * 160;
  const armAngle = -40 - r() * 80;
  const armRad = (armAngle * Math.PI) / 180;
  const ax = 400 + 150 * Math.cos(armRad);
  const ay = 430 + 150 * Math.sin(armRad);
  const sway = (r() - 0.5) * 120;

  if (kind === 'chibi') {
    return `<g>
      ${pedestal}
      <path d="M330 640 q 70 -50 140 0 l 26 160 h -192z" fill="url(#${id}-body)"/>
      <rect x="350" y="760" width="38" height="44" rx="12" fill="#ede9fe"/>
      <rect x="412" y="760" width="38" height="44" rx="12" fill="#ede9fe"/>
      <path d="M250 470 q 0 -190 150 -190 q 150 0 150 190 q 10 120 -20 190 q -130 -40 -260 0 q -30 -70 -20 -190z" fill="${c1}"/>
      <circle cx="400" cy="490" r="128" fill="#f5ecff"/>
      <path d="M272 470 q 40 -140 128 -140 q 100 0 132 140 q -60 -70 -132 -60 q -80 -10 -128 60z" fill="${c1}"/>
      <ellipse cx="352" cy="510" rx="18" ry="24" fill="#1e1b4b"/>
      <ellipse cx="448" cy="510" rx="18" ry="24" fill="#1e1b4b"/>
      <circle cx="358" cy="502" r="6" fill="#fff"/><circle cx="454" cy="502" r="6" fill="#fff"/>
      <ellipse cx="330" cy="550" rx="16" ry="8" fill="${c2}" opacity=".5"/>
      <ellipse cx="470" cy="550" rx="16" ry="8" fill="${c2}" opacity=".5"/>
      <path d="M385 565 q 15 12 30 0" stroke="#1e1b4b" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="${ax + 40}" cy="${ay + 120}" r="26" fill="${c2}" opacity=".9"/>
      ${particles}
    </g>`;
  }

  if (kind === 'action') {
    return `<g>
      ${pedestal}
      <polygon points="340,420 460,420 490,560 450,600 350,600 310,560" fill="url(#${id}-body)"/>
      <polygon points="300,420 340,420 320,540 280,520" fill="#3b3557"/>
      <polygon points="460,420 500,420 ${ax + 60},${ay + 40} ${ax + 40},${ay + 70}" fill="#3b3557"/>
      <polygon points="350,600 395,600 385,800 345,800" fill="#2a2440"/>
      <polygon points="405,600 450,600 455,800 415,800" fill="#2a2440"/>
      <polygon points="335,780 392,780 396,804 330,804" fill="${c1}"/>
      <polygon points="410,780 462,780 468,804 406,804" fill="${c1}"/>
      <polygon points="350,300 450,300 470,360 440,420 360,420 330,360" fill="#4c4670"/>
      <rect x="352" y="340" width="96" height="20" rx="6" fill="${c2}"/>
      <rect x="352" y="340" width="96" height="20" rx="6" fill="${c2}" opacity=".6" filter="url(#${id}-glow)"/>
      <line x1="${ax + 50}" y1="${ay + 55}" x2="${ax + 150}" y2="${ay - 120}" stroke="${c2}" stroke-width="12" stroke-linecap="round" filter="url(#${id}-glow)"/>
      <line x1="${ax + 50}" y1="${ay + 55}" x2="${ax + 150}" y2="${ay - 120}" stroke="#ecfeff" stroke-width="4" stroke-linecap="round"/>
      ${particles}
    </g>`;
  }

  const scale = kind === 'statue' ? 0.86 : 1;
  const statueBase =
    kind === 'statue'
      ? `<rect x="170" y="760" width="460" height="40" rx="6" fill="#211c33" stroke="${c2}" stroke-opacity=".5"/>
         <path d="M200 760 q 60 -70 120 -20 q 50 -60 90 -10 q 60 -50 110 10 q 40 -30 80 20z" fill="${c1}" opacity=".55"/>`
      : '';
  return `<g>
    ${pedestal}
    ${statueBase}
    <g transform="translate(${400 - 400 * scale} ${(1 - scale) * 760}) scale(${scale})">
      <path d="M400 420 C ${300 + sway} 500, 230 650, ${210 + sway / 2} 790 L ${590 + sway / 2} 790 C 570 650, ${500 + sway} 500, 400 420 Z" fill="url(#${id}-body)" opacity=".95"/>
      <path d="M400 420 C 330 520, 300 650, 300 790 L 500 790 C 500 650, 470 520, 400 420Z" fill="#000" opacity=".18"/>
      <path d="M360 400 q 40 -20 80 0 l 18 120 q -58 22 -116 0z" fill="#3a3358"/>
      <path d="M440 430 L ${ax} ${ay}" stroke="#f5ecff" stroke-width="20" stroke-linecap="round"/>
      <path d="M360 430 Q 320 520 330 580" stroke="#f5ecff" stroke-width="20" stroke-linecap="round" fill="none"/>
      <path d="M335 300 q -40 ${hairLen * 0.6} -20 ${hairLen} q 30 -30 40 -60 q 20 ${-hairLen * 0.5} 45 ${-hairLen * 0.7}z" fill="${c1}"/>
      <path d="M465 300 q 40 ${hairLen * 0.6} 20 ${hairLen} q -30 -30 -40 -60 q -20 ${-hairLen * 0.5} -45 ${-hairLen * 0.7}z" fill="${c1}"/>
      <circle cx="400" cy="320" r="62" fill="#f5ecff"/>
      <path d="M336 318 q 8 -84 64 -84 q 62 0 68 84 q -30 -40 -68 -40 q -36 0 -64 40z" fill="${c1}"/>
      <circle cx="${ax}" cy="${ay}" r="16" fill="#f5ecff"/>
      <circle cx="${ax}" cy="${ay}" r="38" fill="${c2}" opacity=".35" filter="url(#${id}-glow)"/>
    </g>
    ${particles}
  </g>`;
}

function defs(id: string, pal: [string, string, string]) {
  const [bg, c1, c2] = pal;
  return `<defs>
    <radialGradient id="${id}-bg" cx="50%" cy="40%" r="75%">
      <stop offset="0" stop-color="${c1}" stop-opacity=".55"/>
      <stop offset=".55" stop-color="${bg}"/>
      <stop offset="1" stop-color="#07070b"/>
    </radialGradient>
    <linearGradient id="${id}-body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="${id}-base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2e2945"/>
      <stop offset="1" stop-color="#110f1a"/>
    </linearGradient>
    <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
    <linearGradient id="${id}-floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#07070b" stop-opacity="0"/>
      <stop offset="1" stop-color="#07070b" stop-opacity=".7"/>
    </linearGradient>
    <pattern id="${id}-grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="#fff" stroke-opacity=".04"/>
    </pattern>
  </defs>`;
}

function productSvg(p: SeedProduct, view: 1 | 2): string {
  const series = ANIME_SERIES.find((s) => s.name === p.franchise && s.slug !== 'uncategorized');
  const acrylic = Boolean(p.sample && p.slug.endsWith('acrylic-stand'));
  const kind: Kind = acrylic ? 'chibi' : KIND_BY_CATEGORY[p.category] ?? 'figure';
  const base = PALETTES[(FRANCHISE_PALETTE[p.franchise ?? ''] ?? hash(p.slug)) % PALETTES.length];
  const pal: [string, string, string] = view === 1 ? base : [base[0], base[1], base[2]];
  const id = `p${hash(p.slug + view).toString(36)}`;
  const isCharacter = kind === 'figure' || kind === 'statue' || kind === 'chibi' || kind === 'action';
  // Same character in both views (seeded by slug); view 2 is a close-up detail shot.
  const figure = figureGroup(kind, p.slug, pal, id, { detail: view === 2 && isCharacter, theme: series?.slug, acrylic });
  const art = view === 2 && !isCharacter ? `<g transform="translate(800 0) scale(-1 1)">${figure}</g>` : figure;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" role="img" aria-label="${esc(p.name)} — original artwork">
  ${defs(id, pal)}
  <rect width="800" height="1000" fill="url(#${id}-bg)"/>
  <rect width="800" height="1000" fill="url(#${id}-grid)"/>
  <circle cx="400" cy="460" r="260" fill="${pal[1]}" opacity=".16" filter="url(#${id}-glow)"/>
  ${art}
  <rect y="930" width="800" height="70" fill="url(#${id}-floor)"/>
</svg>
`;
}

function categorySvg(slug: string, name: string, index: number): string {
  const kind = KIND_BY_CATEGORY[slug] ?? 'figure';
  const pal = PALETTES[index % PALETTES.length];
  const id = `c${index}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" role="img" aria-label="${esc(name)} category placeholder artwork">
  ${defs(id, pal)}
  <rect width="800" height="1000" fill="url(#${id}-bg)"/>
  <rect width="800" height="1000" fill="url(#${id}-grid)"/>
  <circle cx="400" cy="440" r="300" fill="${pal[2]}" opacity=".12" filter="url(#${id}-glow)"/>
  ${figureGroup(kind, slug, pal, id)}
</svg>
`;
}

/** Empty hero stage (background + three pedestals) used when real hero figure photos are imported. */
function heroStageSvg(): string {
  const id = 'stage';
  const pal = PALETTES[0];
  const pedestal = (cx: number, cy: number, rx: number) => `
    <ellipse cx="${cx}" cy="${cy + rx * 0.32}" rx="${rx * 1.1}" ry="${rx * 0.2}" fill="#000" opacity=".5"/>
    <rect x="${cx - rx}" y="${cy}" width="${rx * 2}" height="${rx * 0.26}" rx="10" fill="url(#${id}-base)"/>
    <ellipse cx="${cx}" cy="${cy + rx * 0.26}" rx="${rx}" ry="${rx * 0.17}" fill="#110f1a"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.17}" fill="#2a2440" stroke="#22d3ee" stroke-opacity=".55" stroke-width="2.5"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.92}" ry="${rx * 0.13}" fill="none" stroke="#8b5cf6" stroke-opacity=".35" stroke-width="1.5"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1000" role="img" aria-label="Dark display stage with three glowing circular platforms">
  ${defs(id, pal)}
  <rect width="1200" height="1000" fill="url(#${id}-bg)"/>
  <rect width="1200" height="1000" fill="url(#${id}-grid)"/>
  <circle cx="600" cy="420" r="380" fill="#8b5cf6" opacity=".18" filter="url(#${id}-glow)"/>
  <circle cx="900" cy="300" r="200" fill="#22d3ee" opacity=".12" filter="url(#${id}-glow)"/>
  ${pedestal(290, 790, 135)}
  ${pedestal(930, 790, 125)}
  ${pedestal(600, 830, 200)}
</svg>
`;
}

function heroSvg(): string {
  const id = 'hero';
  const pal = PALETTES[0];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1000" role="img" aria-label="Three original anime-style collectible figures on glowing pedestals">
  ${defs(id, pal)}
  ${defs('h2', PALETTES[3])}
  ${defs('h3', PALETTES[2])}
  <rect width="1200" height="1000" fill="url(#${id}-bg)"/>
  <rect width="1200" height="1000" fill="url(#${id}-grid)"/>
  <circle cx="600" cy="420" r="380" fill="#8b5cf6" opacity=".18" filter="url(#${id}-glow)"/>
  <circle cx="900" cy="300" r="200" fill="#22d3ee" opacity=".12" filter="url(#${id}-glow)"/>
  <g transform="translate(-40 160) scale(.72)">${figureGroup('figure', 'hero-left', PALETTES[3], 'h2', { theme: HERO_SERIES[0] })}</g>
  <g transform="translate(660 160) scale(.72)">${figureGroup('figure', 'hero-right', PALETTES[2], 'h3', { theme: HERO_SERIES[2] })}</g>
  <g transform="translate(200 -10)">${figureGroup('figure', 'hero-center', pal, id, { theme: HERO_SERIES[1] })}</g>
</svg>
`;
}

function communitySvg(n: number): string {
  const pal = PALETTES[n % PALETTES.length];
  const id = `g${n}`;
  const kinds: Kind[] = ['figure', 'chibi', 'action', 'statue', 'chibi', 'figure', 'case', 'action'];
  const kind = kinds[n % kinds.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="Placeholder community shelf photo ${n + 1}">
  ${defs(id, pal)}
  <rect width="800" height="800" fill="url(#${id}-bg)"/>
  <rect width="800" height="800" fill="url(#${id}-grid)"/>
  <rect y="700" width="800" height="100" fill="#000" opacity=".35"/>
  <g transform="translate(80 -90) scale(.8)">${figureGroup(kind, `community-${n}`, pal, id)}</g>
</svg>
`;
}

// ─────────────────────────────── SQL seed ──────────────────────────────────

const q = (v: string | null | undefined) => (v === null || v === undefined ? 'null' : `'${v.replace(/'/g, "''")}'`);
const num = (v: number | null) => (v === null ? 'null' : v.toFixed(2));

function buildSql(): string {
  const lines: string[] = [];
  lines.push('-- ============================================================================');
  lines.push('--  Nova Figure Vault — demo seed data (GENERATED by scripts/build-seed.ts)');
  lines.push('--  Source: src/data/seedProducts.ts. All products, brands and characters are');
  lines.push('--  fictional. Run after supabase/schema.sql. Safe to re-run (upserts).');
  lines.push('-- ============================================================================');
  lines.push('begin;');
  lines.push('');

  lines.push('-- Categories');
  lines.push('insert into public.categories (slug, name, description, image_url, position, is_active) values');
  lines.push(
    seedCategories
      .map((c) => `  (${q(c.slug)}, ${q(c.name)}, ${q(c.description)}, ${q(categoryImagePath(c.slug))}, ${c.position}, true)`)
      .join(',\n') +
      '\non conflict (slug) do update set name = excluded.name, description = excluded.description, image_url = excluded.image_url, position = excluded.position, is_active = excluded.is_active;',
  );
  lines.push('');

  lines.push('-- Brands');
  lines.push('insert into public.brands (slug, name, description) values');
  lines.push(
    seedBrands.map((b) => `  (${q(b.slug)}, ${q(b.name)}, ${q(b.description)})`).join(',\n') +
      '\non conflict (slug) do update set name = excluded.name, description = excluded.description;',
  );
  lines.push('');

  lines.push('-- Products');
  lines.push(
    'insert into public.products (slug, name, short_description, full_description, category_id, brand_id, franchise, sku, regular_price, sale_price, currency, inventory_quantity, status, badge, release_date, scale, material, dimensions, weight, featured, seo_title, seo_description, sales_count, created_at) values',
  );
  lines.push(
    seedProducts
      .map(
        (p) =>
          `  (${q(p.slug)}, ${q(p.name)}, ${q(p.shortDescription)}, ${q(p.fullDescription)}, (select id from public.categories where slug = ${q(p.category)}), (select id from public.brands where slug = ${q(p.brand)}), ${q(p.franchise)}, ${q(p.sku)}, ${num(p.regularPrice)}, ${num(p.salePrice)}, 'USD', ${p.inventory}, 'active', ${q(p.badge)}, ${q(p.releaseDate)}, ${q(p.scale)}, ${q(p.material)}, ${q(p.dimensions)}, ${q(p.weight)}, ${p.featured}, ${q(`${p.name} | Nova Figure Vault`)}, ${q(p.shortDescription)}, ${p.salesCount}, now() - interval '${p.daysAgo} days')`,
      )
      .join(',\n') +
      `\non conflict (slug) do update set name = excluded.name, short_description = excluded.short_description, full_description = excluded.full_description, category_id = excluded.category_id, brand_id = excluded.brand_id, franchise = excluded.franchise, sku = excluded.sku, regular_price = excluded.regular_price, sale_price = excluded.sale_price, currency = excluded.currency, inventory_quantity = excluded.inventory_quantity, status = excluded.status, badge = excluded.badge, release_date = excluded.release_date, scale = excluded.scale, material = excluded.material, dimensions = excluded.dimensions, weight = excluded.weight, featured = excluded.featured, seo_title = excluded.seo_title, seo_description = excluded.seo_description, sales_count = excluded.sales_count, created_at = excluded.created_at;`,
  );
  lines.push('');

  const slugList = seedProducts.map((p) => q(p.slug)).join(', ');
  lines.push('-- Product images (replaced on every run for seeded products)');
  lines.push(`delete from public.product_images where product_id in (select id from public.products where slug in (${slugList}));`);
  lines.push('insert into public.product_images (product_id, url, alt, position) values');
  lines.push(
    seedProducts
      .flatMap((p) =>
        productImagePaths(p.slug).map(
          (url, i) =>
            `  ((select id from public.products where slug = ${q(p.slug)}), ${q(url)}, ${q(`${p.name} — ${i === 0 ? 'front view' : `view ${i + 1}`}`)}, ${i})`,
        ),
      )
      .join(',\n') + ';',
  );
  lines.push('');

  const withVariants = seedProducts.filter((p) => p.variants?.length);
  if (withVariants.length) {
    lines.push('-- Product variants (editions)');
    lines.push('insert into public.product_variants (product_id, name, sku, price, inventory_quantity, position) values');
    lines.push(
      withVariants
        .flatMap((p) =>
          (p.variants ?? []).map(
            (v, i) =>
              `  ((select id from public.products where slug = ${q(p.slug)}), ${q(v.name)}, ${q(v.sku)}, ${num(v.price)}, ${v.inventory}, ${i})`,
          ),
        )
        .join(',\n') +
        '\non conflict (sku) do update set name = excluded.name, price = excluded.price, inventory_quantity = excluded.inventory_quantity, position = excluded.position;',
    );
    lines.push('');
  }

  lines.push('-- Sample reviews were removed by the store owner; clear any left from older seeds.');
  lines.push(
    `delete from public.reviews where user_id is null and product_id in (select id from public.products where slug in (${slugList}));`,
  );
  lines.push('');

  lines.push('-- Site settings');
  const settings: Array<[string, string]> = [
    ['announcement', seedSettings.announcement],
    ['store_email', seedSettings.storeEmail],
    ['store_phone', seedSettings.storePhone],
    ['store_address', seedSettings.storeAddress],
    ['currency', seedSettings.currency],
    ['shipping_message', seedSettings.shippingMessage],
  ];
  lines.push('insert into public.site_settings (key, value) values');
  lines.push(
    settings.map(([k, v]) => `  (${q(k)}, to_jsonb(${q(v)}::text))`).join(',\n') +
      '\non conflict (key) do nothing;',
  );
  lines.push('');
  lines.push('commit;');
  return lines.join('\n') + '\n';
}

// ─────────────────────────────── Write files ───────────────────────────────

out('supabase/seed.sql', buildSql());
for (const p of seedProducts) {
  out(`public${placeholderProductPath(p.slug, 1)}`, productSvg(p, 1));
  out(`public${placeholderProductPath(p.slug, 2)}`, productSvg(p, 2));
}
seedCategories.forEach((c, i) => out(`public${placeholderCategoryPath(c.slug)}`, categorySvg(c.slug, c.name, i)));
out('public/images/hero/hero-figures.svg', heroSvg());
out('public/images/hero/hero-stage.svg', heroStageSvg());
for (let n = 0; n < 8; n++) out(`public/images/community/shelf-${n + 1}.svg`, communitySvg(n));

console.log(
  `Generated supabase/seed.sql (${seedCategories.length} categories, ${seedBrands.length} brands, ${seedProducts.length} products) and ${seedProducts.length * 2 + seedCategories.length + 9} SVG images.`,
);
