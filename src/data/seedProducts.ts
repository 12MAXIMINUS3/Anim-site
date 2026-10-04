/**
 * ============================================================================
 *  NOVA FIGURE VAULT — DEMONSTRATION CATALOG (single source of truth)
 * ============================================================================
 *  Every character, franchise, brand, product name, description and price in
 *  this file is ORIGINAL and FICTIONAL, created for demonstration purposes.
 *
 *  This file feeds two things:
 *    1. `npm run seed:generate` → writes supabase/seed.sql and the placeholder
 *       SVG artwork in public/images/.
 *    2. The read-only "preview mode" catalog used when Supabase env vars are
 *       not configured (src/services/localCatalog.ts).
 *
 *  To replace the demo inventory with your own authorized products, either
 *  edit this file and re-run `npm run seed:generate`, or manage products
 *  directly in the admin dashboard (/admin/products) once Supabase is live.
 * ============================================================================
 */
import type { ProductBadge, SiteSettings } from '@/types';
import { photoManifest } from './photoManifest';
import { ANIME_SERIES } from './series';

export interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  position: number;
}

export interface SeedBrand {
  slug: string;
  name: string;
  description: string;
}

export interface SeedVariant {
  name: string;
  sku: string;
  /** Absolute price for this edition. `null` → uses product price. */
  price: number | null;
  inventory: number;
}

export interface SeedProduct {
  slug: string;
  name: string;
  category: string; // category slug
  brand: string; // brand slug
  franchise: string | null;
  sku: string;
  regularPrice: number;
  salePrice: number | null;
  inventory: number;
  badge: ProductBadge | null;
  releaseDate: string; // ISO date
  scale: string;
  material: string;
  dimensions: string;
  weight: string;
  featured: boolean;
  /** How many days ago the product was added (drives "newest" ordering). */
  daysAgo: number;
  /** Demo units-sold counter used for the "Best sellers" section. */
  salesCount: number;
  shortDescription: string;
  fullDescription: string;
  variants?: SeedVariant[];
  /** Sample listing for an anime series section — replace with real stock. */
  sample?: boolean;
}

export interface SeedReview {
  authorName: string;
  rating: number;
  title: string;
  body: string;
}

export const seedCategories: SeedCategory[] = [
  {
    slug: 'anime-figures',
    name: 'Anime Figures',
    description: 'Painted scale figures of original heroines, rogues and dreamers — sculpted for the display shelf.',
    position: 1,
  },
  {
    slug: 'statues',
    name: 'Statues',
    description: 'Large-format polystone and resin statues with sculpted bases and museum-grade finishing.',
    position: 2,
  },
  {
    slug: 'chibi-minis',
    name: 'Chibi-Style Minis',
    description: 'Palm-sized, big-head minis with swappable faces and playful accessory sets.',
    position: 3,
  },
  {
    slug: 'action-figures',
    name: 'Action Figures',
    description: 'Highly articulated 1/12 figures with tooling details, alternate hands and effect parts.',
    position: 4,
  },
  {
    slug: 'preorders',
    name: 'Preorders',
    description: 'Reserve upcoming releases before allocation closes. Charged in demo mode only.',
    position: 5,
  },
  {
    slug: 'limited-editions',
    name: 'Limited Editions',
    description: 'Numbered runs, exclusive paint schemes and once-only dioramas.',
    position: 6,
  },
  {
    slug: 'display-cases',
    name: 'Display Cases',
    description: 'Dust-proof acrylic and glass cases with optional LED lighting for your centerpiece pieces.',
    position: 7,
  },
  {
    slug: 'accessories',
    name: 'Accessories',
    description: 'Stands, risers, backdrops and care kits to keep your collection looking new.',
    position: 8,
  },
];

export const seedBrands: SeedBrand[] = [
  { slug: 'lumen-forge', name: 'Lumen Forge', description: 'Scale-figure studio known for translucent effect parts and luminous paint work.' },
  { slug: 'kitsune-atelier', name: 'Kitsune Atelier', description: 'Small-batch atelier focused on dynamic poses and fabric-like sculpting.' },
  { slug: 'moonpetal-toys', name: 'Moonpetal Toys', description: 'Makers of soft-palette chibi minis and character merchandise.' },
  { slug: 'orbit-works', name: 'Orbit Works', description: 'Engineering-first action figure brand with 30+ points of articulation.' },
  { slug: 'glasshaven-studio', name: 'Glasshaven Studio', description: 'Premium polystone statues and limited dioramas in numbered runs.' },
  { slug: 'ironbloom-collectibles', name: 'Ironbloom Collectibles', description: 'Mechanical designs, die-cast parts and weathered finishes.' },
  { slug: 'vault-select', name: 'Vault Select', description: 'Items sourced by the Nova Figure Vault team.' },
  { slug: 'vaultline-display', name: 'Vaultline Display Co.', description: 'Display cases, stands and care accessories designed for collectors.' },
];

/** Fictional franchises used in the demo catalog. */
export const seedFranchises = [
  'Starfall Requiem',
  'Neon Ronin Chronicles',
  'Petal Knight Academy',
  'Abyssal Tide',
  'Clockwork Sky',
  'Emberheart Saga',
  'Vault Originals',
] as const;

export const seedProducts: SeedProduct[] = [
  // ───────────────────────────── Anime Figures ─────────────────────────────
  {
    slug: 'aiko-starfall-comet-gown',
    name: 'Aiko Starfall — Comet Gown Ver.',
    category: 'anime-figures',
    brand: 'lumen-forge',
    franchise: 'Starfall Requiem',
    sku: 'NFV-AF-0001',
    regularPrice: 189.99,
    salePrice: null,
    inventory: 14,
    badge: 'new',
    releaseDate: '2026-09-12',
    scale: '1/7',
    material: 'PVC, ABS',
    dimensions: 'H 25 cm × W 18 cm × D 16 cm',
    weight: '0.9 kg',
    featured: true,
    daysAgo: 3,
    salesCount: 96,
    shortDescription: 'The star-reader of Starfall Requiem mid-twirl, her gown trailing a sculpted comet tail.',
    fullDescription:
      'Aiko Starfall steps off the observatory stairs in her Comet Gown, one hand raised to catch a falling star. The skirt is sculpted in layered translucent PVC with a gradient that fades from midnight indigo to pale silver, and a clear comet-tail effect part sweeps behind her. A constellation-etched base completes the scene. The Deluxe edition adds an alternate smiling face, a star-chart backdrop card and an extra hand holding a lantern.',
    variants: [
      { name: 'Standard Edition', sku: 'NFV-AF-0001-STD', price: null, inventory: 9 },
      { name: 'Deluxe Edition', sku: 'NFV-AF-0001-DLX', price: 219.99, inventory: 5 },
    ],
  },
  {
    slug: 'ren-kurogane-neon-ronin',
    name: 'Ren Kurogane — Neon Ronin',
    category: 'anime-figures',
    brand: 'kitsune-atelier',
    franchise: 'Neon Ronin Chronicles',
    sku: 'NFV-AF-0002',
    regularPrice: 219.0,
    salePrice: 179.0,
    inventory: 11,
    badge: 'sale',
    releaseDate: '2026-04-20',
    scale: '1/7',
    material: 'PVC, ABS, clear acrylic',
    dimensions: 'H 27 cm × W 22 cm × D 20 cm',
    weight: '1.1 kg',
    featured: true,
    daysAgo: 92,
    salesCount: 141,
    shortDescription: 'A rain-soaked swordsman drawing a light-edged blade beneath a flickering city sign.',
    fullDescription:
      'Ren Kurogane, the wandering guardian of Neon Ronin Chronicles, is captured in the instant before a duel. Rain streaks run along his coat in clear acrylic, and his blade is cast in a cyan translucent resin that catches light from every angle. The base recreates a wet rooftop with a hand-painted neon sign reflection.',
  },
  {
    slug: 'mira-hanazono-petal-knight',
    name: 'Mira Hanazono — Petal Knight Uniform',
    category: 'anime-figures',
    brand: 'moonpetal-toys',
    franchise: 'Petal Knight Academy',
    sku: 'NFV-AF-0003',
    regularPrice: 149.99,
    salePrice: null,
    inventory: 22,
    badge: null,
    releaseDate: '2026-02-14',
    scale: '1/8',
    material: 'PVC, ABS',
    dimensions: 'H 21 cm × W 14 cm × D 14 cm',
    weight: '0.6 kg',
    featured: false,
    daysAgo: 160,
    salesCount: 74,
    shortDescription: 'The academy’s top fencing student salutes with a rose-gilded rapier.',
    fullDescription:
      'Mira Hanazono stands at attention in the ceremonial Petal Knight uniform: a fitted navy jacket with gold piping, a pleated skirt with sculpted sakura embroidery and a rapier whose guard blooms into a rose. Her hair ribbon is a separate soft-PVC part that sways with the pose.',
  },
  {
    slug: 'captain-selka-tidebreaker',
    name: 'Captain Selka — Tidebreaker',
    category: 'anime-figures',
    brand: 'orbit-works',
    franchise: 'Abyssal Tide',
    sku: 'NFV-AF-0004',
    regularPrice: 239.0,
    salePrice: null,
    inventory: 30,
    badge: 'preorder',
    releaseDate: '2027-03-15',
    scale: '1/7',
    material: 'PVC, ABS, die-cast',
    dimensions: 'H 29 cm × W 24 cm × D 21 cm',
    weight: '1.3 kg',
    featured: false,
    daysAgo: 6,
    salesCount: 38,
    shortDescription: 'The submarine captain of Abyssal Tide bracing against a sculpted breaking wave.',
    fullDescription:
      'Captain Selka plants her boots on the deck of the Tidebreaker as a wall of water curls overhead. The wave is a large translucent part with layered foam detail, and her die-cast compass pendant adds real heft. Preorder allocation is limited; the expected release window is March 2027.',
  },
  {
    slug: 'yuzu-clockwright-skyship-mechanic',
    name: 'Yuzu Clockwright — Skyship Mechanic',
    category: 'anime-figures',
    brand: 'kitsune-atelier',
    franchise: 'Clockwork Sky',
    sku: 'NFV-AF-0005',
    regularPrice: 175.0,
    salePrice: null,
    inventory: 0,
    badge: 'sold_out',
    releaseDate: '2025-11-02',
    scale: '1/7',
    material: 'PVC, ABS',
    dimensions: 'H 23 cm × W 19 cm × D 17 cm',
    weight: '0.8 kg',
    featured: false,
    daysAgo: 260,
    salesCount: 188,
    shortDescription: 'An airship engineer perched on a brass engine block, wrench in hand.',
    fullDescription:
      'Yuzu Clockwright, chief mechanic of the skyship Marigold, sits cross-legged on a sculpted brass engine with gears you can trace from flywheel to piston. Grease smudges, goggles with clear lenses and a tiny clockwork bird companion round out the piece.',
  },
  {
    slug: 'hikari-ember-phoenix-dancer',
    name: 'Hikari Ember — Phoenix Dancer',
    category: 'anime-figures',
    brand: 'lumen-forge',
    franchise: 'Emberheart Saga',
    sku: 'NFV-AF-0006',
    regularPrice: 289.0,
    salePrice: null,
    inventory: 5,
    badge: 'limited',
    releaseDate: '2026-07-30',
    scale: '1/6',
    material: 'PVC, ABS, translucent resin',
    dimensions: 'H 34 cm × W 30 cm × D 26 cm',
    weight: '1.7 kg',
    featured: true,
    daysAgo: 40,
    salesCount: 122,
    shortDescription: 'A fire-dancer wreathed in translucent phoenix wings, frozen at the height of a spin.',
    fullDescription:
      'Hikari Ember performs the Phoenix Rite in a whirl of flame. Her wings are cast in graduated orange-to-violet resin, and ember particles are suspended on near-invisible clear rods around the figure. Limited to a small production run with a numbered certificate.',
  },
  {
    slug: 'noa-silvermoon-night-library',
    name: 'Noa Silvermoon — Night Library',
    category: 'anime-figures',
    brand: 'moonpetal-toys',
    franchise: 'Starfall Requiem',
    sku: 'NFV-AF-0007',
    regularPrice: 165.0,
    salePrice: 139.0,
    inventory: 8,
    badge: 'sale',
    releaseDate: '2026-01-18',
    scale: '1/7',
    material: 'PVC, ABS',
    dimensions: 'H 22 cm × W 20 cm × D 18 cm',
    weight: '0.85 kg',
    featured: false,
    daysAgo: 190,
    salesCount: 67,
    shortDescription: 'A quiet archivist reading by moonlight atop a tower of sculpted books.',
    fullDescription:
      'Noa Silvermoon, keeper of the Starfall archives, rests on a spiral stack of tomes with a crescent-moon lamp casting sculpted light across the pages. Each book spine features unique printed titles from the in-world library.',
  },
  {
    slug: 'kaito-vale-rooftop-duel',
    name: 'Kaito Vale — Rooftop Duel',
    category: 'anime-figures',
    brand: 'orbit-works',
    franchise: 'Neon Ronin Chronicles',
    sku: 'NFV-AF-0008',
    regularPrice: 139.0,
    salePrice: null,
    inventory: 18,
    badge: 'new',
    releaseDate: '2026-09-01',
    scale: '1/8',
    material: 'PVC, ABS',
    dimensions: 'H 20 cm × W 17 cm × D 15 cm',
    weight: '0.55 kg',
    featured: false,
    daysAgo: 9,
    salesCount: 21,
    shortDescription: 'Ren’s rival crouches on a rooftop ledge, twin tonfa crackling with static.',
    fullDescription:
      'Kaito Vale drops into a low guard on the edge of a rain-slick rooftop. Static arcs are rendered as clear blue effect parts that clip onto each tonfa, and his scarf is sculpted mid-flutter. Displays perfectly opposite Ren Kurogane — Neon Ronin.',
  },

  // ─────────────────────────────── Statues ────────────────────────────────
  {
    slug: 'abyssal-empress-throne-of-coral',
    name: 'The Abyssal Empress — Throne of Coral',
    category: 'statues',
    brand: 'glasshaven-studio',
    franchise: 'Abyssal Tide',
    sku: 'NFV-ST-0009',
    regularPrice: 749.0,
    salePrice: null,
    inventory: 3,
    badge: 'limited',
    releaseDate: '2026-06-10',
    scale: '1/4',
    material: 'Polystone, resin, LED',
    dimensions: 'H 58 cm × W 42 cm × D 38 cm',
    weight: '9.2 kg',
    featured: true,
    daysAgo: 55,
    salesCount: 19,
    shortDescription: 'The ruler of the deep enthroned on living coral, lit from within by bioluminescent LEDs.',
    fullDescription:
      'The Abyssal Empress lounges on a throne grown from coral and sunken shipwreck timber. Hidden USB-powered LEDs illuminate translucent jellyfish and anemone details around the base. Each statue is hand-finished and individually numbered.',
  },
  {
    slug: 'emberheart-dragon-knight-statue',
    name: 'Emberheart Dragon Knight Statue',
    category: 'statues',
    brand: 'ironbloom-collectibles',
    franchise: 'Emberheart Saga',
    sku: 'NFV-ST-0010',
    regularPrice: 529.0,
    salePrice: null,
    inventory: 25,
    badge: 'preorder',
    releaseDate: '2027-01-28',
    scale: '1/6',
    material: 'Polystone, die-cast',
    dimensions: 'H 48 cm × W 36 cm × D 30 cm',
    weight: '7.4 kg',
    featured: false,
    daysAgo: 12,
    salesCount: 26,
    shortDescription: 'A knight in scorched plate armor rising from the coils of a slain ember-wyrm.',
    fullDescription:
      'The Dragon Knight of the Emberheart Saga stands triumphant on the cooling coils of an ember-wyrm. Armor plates are finished with layered metallic paint and heat-tint gradients, and the wyrm’s scales glow through translucent resin cracks.',
  },
  {
    slug: 'starfall-celestial-choir-diorama',
    name: 'Starfall Requiem — Celestial Choir Diorama',
    category: 'statues',
    brand: 'glasshaven-studio',
    franchise: 'Starfall Requiem',
    sku: 'NFV-ST-0011',
    regularPrice: 899.0,
    salePrice: null,
    inventory: 0,
    badge: 'sold_out',
    releaseDate: '2025-12-12',
    scale: '1/6',
    material: 'Polystone, resin, acrylic',
    dimensions: 'H 52 cm × W 60 cm × D 34 cm',
    weight: '11 kg',
    featured: false,
    daysAgo: 240,
    salesCount: 44,
    shortDescription: 'Three star-singers performing on a floating observatory platform.',
    fullDescription:
      'A centerpiece diorama featuring three choir members of the Starfall Requiem suspended around a floating observatory. Acrylic star rings orbit the scene on hidden supports. This edition has fully sold through its production run.',
  },
  {
    slug: 'clockwork-colossus-bust',
    name: 'Clockwork Colossus Bust',
    category: 'statues',
    brand: 'ironbloom-collectibles',
    franchise: 'Clockwork Sky',
    sku: 'NFV-ST-0012',
    regularPrice: 349.0,
    salePrice: 299.0,
    inventory: 7,
    badge: 'sale',
    releaseDate: '2026-03-08',
    scale: '1/3 bust',
    material: 'Polystone, die-cast gears',
    dimensions: 'H 32 cm × W 28 cm × D 22 cm',
    weight: '4.6 kg',
    featured: false,
    daysAgo: 130,
    salesCount: 52,
    shortDescription: 'The guardian automaton of Clockwork Sky with exposed, rotating die-cast gears.',
    fullDescription:
      'This 1/3 bust captures the Clockwork Colossus with its faceplate half-open to reveal working gears. Turn the key on the back and the gears rotate through the chest cavity. Weathered brass and verdigris finishes are hand-applied.',
  },
  {
    slug: 'bloomguard-captain-statue',
    name: 'Petal Knight Captain — Bloomguard Statue',
    category: 'statues',
    brand: 'glasshaven-studio',
    franchise: 'Petal Knight Academy',
    sku: 'NFV-ST-0013',
    regularPrice: 619.0,
    salePrice: null,
    inventory: 6,
    badge: 'new',
    releaseDate: '2026-09-20',
    scale: '1/4',
    material: 'Polystone, resin',
    dimensions: 'H 55 cm × W 34 cm × D 34 cm',
    weight: '8.1 kg',
    featured: false,
    daysAgo: 2,
    salesCount: 8,
    shortDescription: 'The academy’s captain of the guard, shield raised beneath an arch of blooming roses.',
    fullDescription:
      'Captain Lysande of the Bloomguard stands beneath a sculpted rose arch with her heater shield raised. Over two hundred individually sculpted petals frame the statue, and the cape features a hand-painted academy crest.',
  },

  // ─────────────────────────── Chibi-Style Minis ──────────────────────────
  {
    slug: 'aiko-starfall-chibi-mini',
    name: 'Aiko Starfall Chibi Mini',
    category: 'chibi-minis',
    brand: 'moonpetal-toys',
    franchise: 'Starfall Requiem',
    sku: 'NFV-CM-0014',
    regularPrice: 54.99,
    salePrice: null,
    inventory: 40,
    badge: null,
    releaseDate: '2026-05-05',
    scale: 'Non-scale (approx. 10 cm)',
    material: 'PVC, ABS',
    dimensions: 'H 10 cm × W 7 cm × D 7 cm',
    weight: '0.15 kg',
    featured: true,
    daysAgo: 70,
    salesCount: 210,
    shortDescription: 'Pocket-sized Aiko with three faces, a telescope and a sleepy comet plush.',
    fullDescription:
      'The star-reader in chibi form! Includes three swappable faces (cheerful, focused, sleepy), a fold-out telescope, a tiny comet plush and a hinged neck joint for head tilts. Compatible with standard mini-figure stands.',
  },
  {
    slug: 'ren-kurogane-chibi-mini',
    name: 'Ren Kurogane Chibi Mini',
    category: 'chibi-minis',
    brand: 'moonpetal-toys',
    franchise: 'Neon Ronin Chronicles',
    sku: 'NFV-CM-0015',
    regularPrice: 54.99,
    salePrice: 44.99,
    inventory: 26,
    badge: 'sale',
    releaseDate: '2026-04-12',
    scale: 'Non-scale (approx. 10 cm)',
    material: 'PVC, ABS',
    dimensions: 'H 10 cm × W 7 cm × D 7 cm',
    weight: '0.15 kg',
    featured: false,
    daysAgo: 95,
    salesCount: 175,
    shortDescription: 'Mini Ren with a bendable umbrella, glowing blade and a steaming noodle cup.',
    fullDescription:
      'Ren takes a break between duels. This chibi mini includes a clear umbrella with a poseable handle, his cyan blade, a noodle-cup accessory with sculpted steam and three expressions including a determined glare.',
  },
  {
    slug: 'mira-hanazono-chibi-mini',
    name: 'Mira Hanazono Chibi Mini',
    category: 'chibi-minis',
    brand: 'moonpetal-toys',
    franchise: 'Petal Knight Academy',
    sku: 'NFV-CM-0016',
    regularPrice: 52.99,
    salePrice: null,
    inventory: 60,
    badge: 'preorder',
    releaseDate: '2027-02-10',
    scale: 'Non-scale (approx. 10 cm)',
    material: 'PVC, ABS',
    dimensions: 'H 10 cm × W 7 cm × D 7 cm',
    weight: '0.15 kg',
    featured: false,
    daysAgo: 4,
    salesCount: 30,
    shortDescription: 'Fencing-practice Mira with a foam rapier, trophy and petal-burst effect.',
    fullDescription:
      'Mira in her practice whites with a foam rapier, a tiny academy trophy and a clip-on petal-burst effect for victory poses. Preorders are expected to ship in February 2027.',
  },
  {
    slug: 'yuzu-clockwright-chibi-mini',
    name: 'Yuzu Clockwright Chibi Mini',
    category: 'chibi-minis',
    brand: 'moonpetal-toys',
    franchise: 'Clockwork Sky',
    sku: 'NFV-CM-0017',
    regularPrice: 52.99,
    salePrice: null,
    inventory: 0,
    badge: 'sold_out',
    releaseDate: '2025-10-22',
    scale: 'Non-scale (approx. 10 cm)',
    material: 'PVC, ABS',
    dimensions: 'H 10 cm × W 8 cm × D 7 cm',
    weight: '0.16 kg',
    featured: false,
    daysAgo: 280,
    salesCount: 232,
    shortDescription: 'Tiny mechanic Yuzu with an oversized wrench and a wind-up bird.',
    fullDescription:
      'Yuzu in chibi form comes with an oversized wrench, interchangeable goggles (on head / over eyes) and her clockwork bird companion on a clear perch arm.',
  },
  {
    slug: 'pip-the-vault-sprite-chibi-mini',
    name: 'Pip the Vault Sprite Chibi Mini',
    category: 'chibi-minis',
    brand: 'moonpetal-toys',
    franchise: 'Vault Originals',
    sku: 'NFV-CM-0018',
    regularPrice: 39.99,
    salePrice: null,
    inventory: 75,
    badge: 'new',
    releaseDate: '2026-09-25',
    scale: 'Non-scale (approx. 8 cm)',
    material: 'PVC, ABS',
    dimensions: 'H 8 cm × W 7 cm × D 6 cm',
    weight: '0.1 kg',
    featured: false,
    daysAgo: 1,
    salesCount: 15,
    shortDescription: 'Our own mascot: a little vault guardian holding a glowing key.',
    fullDescription:
      'Pip is the Nova Figure Vault house mascot — a small sprite who guards collectors’ shelves at night. Includes a glow-in-the-dark key, a treasure chest accessory and two faces.',
  },
  {
    slug: 'selka-and-bubbles-chibi-set',
    name: 'Selka & Bubbles Chibi Mini Set',
    category: 'chibi-minis',
    brand: 'moonpetal-toys',
    franchise: 'Abyssal Tide',
    sku: 'NFV-CM-0019',
    regularPrice: 64.99,
    salePrice: null,
    inventory: 19,
    badge: null,
    releaseDate: '2026-06-28',
    scale: 'Non-scale (approx. 10 cm)',
    material: 'PVC, ABS',
    dimensions: 'H 10 cm × W 12 cm × D 8 cm',
    weight: '0.22 kg',
    featured: false,
    daysAgo: 48,
    salesCount: 81,
    shortDescription: 'Captain Selka with her pufferfish first mate, Bubbles, in a two-figure set.',
    fullDescription:
      'A two-figure set featuring a chibi Captain Selka and Bubbles, the inflatable pufferfish first mate. Bubbles comes in both deflated and fully puffed versions, plus a tiny ship’s wheel accessory.',
  },

  // ───────────────────────────── Action Figures ───────────────────────────
  {
    slug: 'neon-ronin-vanguard-action-figure',
    name: 'Neon Ronin Vanguard 1/12 Action Figure',
    category: 'action-figures',
    brand: 'orbit-works',
    franchise: 'Neon Ronin Chronicles',
    sku: 'NFV-AC-0020',
    regularPrice: 129.0,
    salePrice: null,
    inventory: 20,
    badge: 'new',
    releaseDate: '2026-08-30',
    scale: '1/12',
    material: 'PVC, ABS, POM joints',
    dimensions: 'H 16 cm (figure) · box 30 × 20 × 8 cm',
    weight: '0.45 kg',
    featured: true,
    daysAgo: 14,
    salesCount: 64,
    shortDescription: 'A 32-point articulated armored vanguard with LED-ready visor and 9 hand pairs.',
    fullDescription:
      'The Vanguard unit of Neon Ronin Chronicles features 32 points of articulation, diecast-feel POM joints, a removable visor with LED cavity, nine pairs of hands and three energy-blade effect parts. The Deluxe set adds a hover-bike and a flight stand.',
    variants: [
      { name: 'Standard Set', sku: 'NFV-AC-0020-STD', price: null, inventory: 14 },
      { name: 'Deluxe Set (with hover-bike)', sku: 'NFV-AC-0020-DLX', price: 179.0, inventory: 6 },
    ],
  },
  {
    slug: 'tidebreaker-marine-unit-action-figure',
    name: 'Tidebreaker Marine Unit 1/12 Action Figure',
    category: 'action-figures',
    brand: 'orbit-works',
    franchise: 'Abyssal Tide',
    sku: 'NFV-AC-0021',
    regularPrice: 119.0,
    salePrice: 95.0,
    inventory: 16,
    badge: 'sale',
    releaseDate: '2026-02-25',
    scale: '1/12',
    material: 'PVC, ABS, POM joints',
    dimensions: 'H 15.5 cm (figure)',
    weight: '0.4 kg',
    featured: false,
    daysAgo: 150,
    salesCount: 58,
    shortDescription: 'Deep-sea marine with harpoon rifle, rebreather helmet and swappable flippers.',
    fullDescription:
      'Tidebreaker marines guard the submarine against abyssal threats. This 1/12 figure includes a harpoon rifle with extended line, a rebreather helmet with clear visor, swappable boots and flippers, and a coral display base.',
  },
  {
    slug: 'emberheart-lancer-action-figure',
    name: 'Emberheart Lancer 1/12 Action Figure',
    category: 'action-figures',
    brand: 'ironbloom-collectibles',
    franchise: 'Emberheart Saga',
    sku: 'NFV-AC-0022',
    regularPrice: 134.0,
    salePrice: null,
    inventory: 40,
    badge: 'preorder',
    releaseDate: '2027-04-18',
    scale: '1/12',
    material: 'PVC, ABS, die-cast',
    dimensions: 'H 17 cm (figure)',
    weight: '0.5 kg',
    featured: false,
    daysAgo: 5,
    salesCount: 22,
    shortDescription: 'A flame-lance cavalier with die-cast pauldrons and fabric tabard.',
    fullDescription:
      'The Emberheart Lancer features die-cast shoulder plates, a soft-goods tabard, a 30 cm flame lance with clear flame wrap and a kite shield with sculpted heraldry. Expected to ship in April 2027.',
  },
  {
    slug: 'clockwork-sentinel-mech',
    name: 'Clockwork Sentinel Mech 1/12',
    category: 'action-figures',
    brand: 'ironbloom-collectibles',
    franchise: 'Clockwork Sky',
    sku: 'NFV-AC-0023',
    regularPrice: 159.0,
    salePrice: null,
    inventory: 4,
    badge: null,
    releaseDate: '2026-05-30',
    scale: '1/12',
    material: 'ABS, die-cast, POM',
    dimensions: 'H 22 cm × W 14 cm × D 12 cm',
    weight: '0.8 kg',
    featured: false,
    daysAgo: 66,
    salesCount: 47,
    shortDescription: 'A steam-powered sentinel with opening cockpit and rotating smoke-stack turret.',
    fullDescription:
      'The Clockwork Sentinel stands guard over the skyship docks. The cockpit hatch opens to seat a 1/12 pilot, the smoke-stack turret rotates 360°, and the legs feature piston-linked articulation.',
  },
  {
    slug: 'starfall-ranger-action-figure',
    name: 'Starfall Ranger 1/12 Action Figure',
    category: 'action-figures',
    brand: 'orbit-works',
    franchise: 'Starfall Requiem',
    sku: 'NFV-AC-0024',
    regularPrice: 124.0,
    salePrice: null,
    inventory: 0,
    badge: 'sold_out',
    releaseDate: '2025-09-14',
    scale: '1/12',
    material: 'PVC, ABS, POM joints',
    dimensions: 'H 16 cm (figure)',
    weight: '0.42 kg',
    featured: false,
    daysAgo: 300,
    salesCount: 156,
    shortDescription: 'An observatory ranger with star-bow, quiver and constellation cloak.',
    fullDescription:
      'The Starfall Ranger patrols the observatory perimeter. Includes a starlight bow with nocked-arrow part, a quiver of translucent arrows, a wired constellation cloak and five hand pairs.',
  },

  // ─────────────────────────────── Preorders ──────────────────────────────
  {
    slug: 'aiko-starfall-eclipse-armor',
    name: 'Aiko Starfall — Eclipse Armor Ver.',
    category: 'preorders',
    brand: 'lumen-forge',
    franchise: 'Starfall Requiem',
    sku: 'NFV-PO-0025',
    regularPrice: 259.0,
    salePrice: null,
    inventory: 50,
    badge: 'preorder',
    releaseDate: '2027-05-20',
    scale: '1/7',
    material: 'PVC, ABS, metallic plating',
    dimensions: 'H 28 cm × W 24 cm × D 20 cm',
    weight: '1.2 kg',
    featured: true,
    daysAgo: 7,
    salesCount: 61,
    shortDescription: 'Aiko’s battle form: eclipse-black plate armor with a corona halo effect.',
    fullDescription:
      'In the final act of Starfall Requiem, Aiko dons the Eclipse Armor. The plate armor uses vacuum-metallized parts, and a translucent corona halo floats behind her on a hidden arm. Release window: May 2027.',
  },
  {
    slug: 'kaito-vale-midnight-rain',
    name: 'Kaito Vale — Midnight Rain',
    category: 'preorders',
    brand: 'kitsune-atelier',
    franchise: 'Neon Ronin Chronicles',
    sku: 'NFV-PO-0026',
    regularPrice: 205.0,
    salePrice: null,
    inventory: 35,
    badge: 'preorder',
    releaseDate: '2027-02-27',
    scale: '1/7',
    material: 'PVC, ABS',
    dimensions: 'H 26 cm × W 18 cm × D 18 cm',
    weight: '1.0 kg',
    featured: false,
    daysAgo: 10,
    salesCount: 29,
    shortDescription: 'Kaito off-duty under a transparent umbrella, city lights reflected below.',
    fullDescription:
      'A quieter moment for Kaito Vale: hood up, umbrella tilted, standing over a puddle base that reflects a sculpted neon skyline. The umbrella canopy is clear PVC with printed raindrops.',
  },
  {
    slug: 'noa-silvermoon-eternal-archive',
    name: 'Noa Silvermoon — Eternal Archive 1/6',
    category: 'preorders',
    brand: 'lumen-forge',
    franchise: 'Starfall Requiem',
    sku: 'NFV-PO-0027',
    regularPrice: 329.0,
    salePrice: null,
    inventory: 20,
    badge: 'preorder',
    releaseDate: '2027-06-30',
    scale: '1/6',
    material: 'PVC, ABS, acrylic',
    dimensions: 'H 36 cm × W 30 cm × D 28 cm',
    weight: '1.9 kg',
    featured: false,
    daysAgo: 11,
    salesCount: 17,
    shortDescription: 'Noa summoning a spiral of floating pages from the infinite archive.',
    fullDescription:
      'Noa Silvermoon in a large 1/6 scale, surrounded by a spiral of acrylic pages that float on a central clear column. Each page is printed with original archive glyphs. Release window: June 2027.',
  },

  // ─────────────────────────── Limited Editions ───────────────────────────
  {
    slug: 'hikari-ember-gold-flame-exclusive',
    name: 'Hikari Ember — Gold Flame Exclusive',
    category: 'limited-editions',
    brand: 'lumen-forge',
    franchise: 'Emberheart Saga',
    sku: 'NFV-LE-0028',
    regularPrice: 349.0,
    salePrice: null,
    inventory: 2,
    badge: 'limited',
    releaseDate: '2026-08-15',
    scale: '1/7',
    material: 'PVC, ABS, gold-tone plating',
    dimensions: 'H 30 cm × W 26 cm × D 22 cm',
    weight: '1.4 kg',
    featured: true,
    daysAgo: 25,
    salesCount: 88,
    shortDescription: 'Vault-exclusive gold flame colorway, numbered to 500 pieces.',
    fullDescription:
      'An exclusive repaint of Hikari Ember with gold-tone plated flames, a white ceremonial costume and a black lacquer base with gold numbering. Limited to 500 pieces worldwide, each with a certificate of authenticity.',
  },
  {
    slug: 'ren-kurogane-chrome-edition-bust',
    name: 'Ren Kurogane — Chrome Edition Bust',
    category: 'limited-editions',
    brand: 'glasshaven-studio',
    franchise: 'Neon Ronin Chronicles',
    sku: 'NFV-LE-0029',
    regularPrice: 279.0,
    salePrice: null,
    inventory: 0,
    badge: 'sold_out',
    releaseDate: '2026-03-30',
    scale: '1/2 bust',
    material: 'Polystone, chrome finish',
    dimensions: 'H 30 cm × W 24 cm × D 18 cm',
    weight: '3.8 kg',
    featured: false,
    daysAgo: 120,
    salesCount: 300,
    shortDescription: 'A mirror-chrome bust of Ren, limited to 300 pieces — fully allocated.',
    fullDescription:
      'Ren Kurogane rendered in a mirror-chrome finish over polystone, with only the eyes and neon visor stripe hand-painted. The edition of 300 is fully allocated.',
  },
  {
    slug: 'vault-anniversary-crystal-diorama',
    name: 'Vault Anniversary Crystal Diorama',
    category: 'limited-editions',
    brand: 'glasshaven-studio',
    franchise: 'Vault Originals',
    sku: 'NFV-LE-0030',
    regularPrice: 449.0,
    salePrice: null,
    inventory: 9,
    badge: 'limited',
    releaseDate: '2026-10-01',
    scale: 'Diorama',
    material: 'Resin, crystal-clear acrylic, LED',
    dimensions: 'H 35 cm × W 40 cm × D 25 cm',
    weight: '4.2 kg',
    featured: false,
    daysAgo: 1,
    salesCount: 12,
    shortDescription: 'Pip guarding a crystal vault, lit by a color-shifting LED base.',
    fullDescription:
      'Celebrating the Vault’s anniversary: Pip the Vault Sprite stands atop a faceted crystal vault door. The LED base cycles through purple, indigo and cyan. Numbered edition of 1,000.',
  },

  // ───────────────────────────── Display Cases ────────────────────────────
  {
    slug: 'aurora-led-display-case-single',
    name: 'Aurora LED Display Case — Single',
    category: 'display-cases',
    brand: 'vaultline-display',
    franchise: null,
    sku: 'NFV-DC-0031',
    regularPrice: 89.0,
    salePrice: null,
    inventory: 33,
    badge: null,
    releaseDate: '2026-01-05',
    scale: 'Fits up to 1/6',
    material: 'UV-resistant acrylic, aluminum LED base',
    dimensions: 'H 40 cm × W 30 cm × D 30 cm',
    weight: '2.6 kg',
    featured: true,
    daysAgo: 200,
    salesCount: 133,
    shortDescription: 'A 3 mm UV-resistant acrylic case with a dimmable, color-tunable LED base.',
    fullDescription:
      'Protect your centerpiece from dust and UV fading. The Aurora case uses 3 mm UV-resistant acrylic, magnetic lid closure and a USB-C LED base with warm, cool and RGB modes.',
  },
  {
    slug: 'tower-vitrine-five-shelf-case',
    name: 'Tower Vitrine 5-Shelf Case',
    category: 'display-cases',
    brand: 'vaultline-display',
    franchise: null,
    sku: 'NFV-DC-0032',
    regularPrice: 249.0,
    salePrice: 209.0,
    inventory: 10,
    badge: 'sale',
    releaseDate: '2025-12-01',
    scale: 'Fits 1/8 – 1/7 per shelf',
    material: 'Tempered glass, steel frame, LED strips',
    dimensions: 'H 160 cm × W 42 cm × D 36 cm',
    weight: '24 kg',
    featured: false,
    daysAgo: 230,
    salesCount: 39,
    shortDescription: 'A tall tempered-glass vitrine with five adjustable shelves and a locking door.',
    fullDescription:
      'The Tower Vitrine holds an entire series. Five height-adjustable tempered-glass shelves, a mirrored back panel, front-mounted LED strips and a keyed lock keep your collection safe and lit.',
  },
  {
    slug: 'mini-shelf-riser-set',
    name: 'Mini Shelf Riser Set (3 pcs)',
    category: 'display-cases',
    brand: 'vaultline-display',
    franchise: null,
    sku: 'NFV-DC-0033',
    regularPrice: 34.99,
    salePrice: null,
    inventory: 80,
    badge: 'new',
    releaseDate: '2026-09-18',
    scale: 'Ideal for chibi minis',
    material: 'Clear acrylic',
    dimensions: '30 × 10 cm, 3 tiers',
    weight: '0.5 kg',
    featured: false,
    daysAgo: 8,
    salesCount: 26,
    shortDescription: 'Stepped clear risers that turn a flat shelf into a stadium of minis.',
    fullDescription:
      'Three stepped acrylic risers (2, 5 and 8 cm) let you stage rows of chibi minis without hiding anyone in the back. Polished edges and anti-slip feet.',
  },
  {
    slug: 'dust-guard-acrylic-cube-30',
    name: 'Dust-Guard Acrylic Cube 30 cm',
    category: 'display-cases',
    brand: 'vaultline-display',
    franchise: null,
    sku: 'NFV-DC-0034',
    regularPrice: 59.0,
    salePrice: null,
    inventory: 45,
    badge: null,
    releaseDate: '2025-08-20',
    scale: 'Fits 1/8 – 1/7',
    material: 'Acrylic, black ABS base',
    dimensions: 'H 30 cm × W 30 cm × D 30 cm',
    weight: '1.8 kg',
    featured: false,
    daysAgo: 330,
    salesCount: 98,
    shortDescription: 'A simple, crystal-clear cube cover with a matte black base.',
    fullDescription:
      'A no-fuss display cube for 1/8 and 1/7 figures. The cover lifts straight off a recessed matte base, and the seams are solvent-welded for clarity.',
  },

  // ────────────────────────────── Accessories ─────────────────────────────
  {
    slug: 'gravity-stand-flight-base-kit',
    name: 'Gravity Stand Flight Base Kit',
    category: 'accessories',
    brand: 'vaultline-display',
    franchise: null,
    sku: 'NFV-AX-0035',
    regularPrice: 24.99,
    salePrice: null,
    inventory: 120,
    badge: null,
    releaseDate: '2025-07-10',
    scale: 'Universal (1/12 – 1/7)',
    material: 'Acrylic, ABS clips',
    dimensions: 'Base 12 cm, arm 8 – 18 cm',
    weight: '0.2 kg',
    featured: false,
    daysAgo: 360,
    salesCount: 260,
    shortDescription: 'Adjustable clear flight stands with five clip adapters for mid-air poses.',
    fullDescription:
      'Pose figures mid-leap. Includes two weighted clear bases, telescoping arms with three ball joints and five clip/peg adapters that fit most 1/12 and scale figures.',
  },
  {
    slug: 'microfiber-figure-care-kit',
    name: 'Microfiber Figure Care Kit',
    category: 'accessories',
    brand: 'vaultline-display',
    franchise: null,
    sku: 'NFV-AX-0036',
    regularPrice: 19.99,
    salePrice: 15.99,
    inventory: 90,
    badge: 'sale',
    releaseDate: '2025-06-01',
    scale: 'Universal',
    material: 'Microfiber, soft bristle, cotton',
    dimensions: 'Pouch 18 × 12 cm',
    weight: '0.12 kg',
    featured: false,
    daysAgo: 390,
    salesCount: 310,
    shortDescription: 'Brushes, cloths and swabs for safely dusting delicate paint and clear parts.',
    fullDescription:
      'Everything you need for routine figure care: a goat-hair dusting brush, two microfiber cloths, precision swabs and a manual air blower, all in a zip pouch.',
  },
  {
    slug: 'starfall-backdrop-card-set',
    name: 'Starfall Requiem Backdrop Card Set',
    category: 'accessories',
    brand: 'lumen-forge',
    franchise: 'Starfall Requiem',
    sku: 'NFV-AX-0037',
    regularPrice: 14.99,
    salePrice: null,
    inventory: 150,
    badge: 'new',
    releaseDate: '2026-09-10',
    scale: 'Universal',
    material: 'Matte card stock',
    dimensions: '6 cards, 30 × 20 cm',
    weight: '0.18 kg',
    featured: false,
    daysAgo: 6,
    salesCount: 34,
    shortDescription: 'Six illustrated night-sky backdrops sized for 1/7 and 1/8 displays.',
    fullDescription:
      'Six double-sided, matte backdrop cards featuring original Starfall Requiem skyscapes. Includes two fold-out easel stands.',
  },
  {
    slug: 'figure-storage-box-pro',
    name: 'Figure Storage Box Pro',
    category: 'accessories',
    brand: 'vaultline-display',
    franchise: null,
    sku: 'NFV-AX-0038',
    regularPrice: 29.99,
    salePrice: null,
    inventory: 64,
    badge: null,
    releaseDate: '2025-10-01',
    scale: 'Fits boxes up to 35 cm',
    material: 'Corrugated polypropylene, foam inserts',
    dimensions: 'H 38 cm × W 32 cm × D 26 cm',
    weight: '0.9 kg',
    featured: false,
    daysAgo: 290,
    salesCount: 72,
    shortDescription: 'Crush-resistant storage box with cut-to-fit foam for original packaging.',
    fullDescription:
      'Keep original boxes in mint condition. Rigid corrugated polypropylene walls, a label window and cut-to-fit foam inserts protect packaging during storage or moves.',
  },
];

/**
 * Sample listings for each anime series in src/data/series.ts (3 per series),
 * so every series section of the shop has items. Generic names, placeholder
 * artwork and no reviews — edit each one in Admin → Products to match your
 * real stock (title, photos, price, specs), or delete it.
 */
const SAMPLE_TEMPLATES = [
  {
    key: 'scale-figure',
    label: 'Premium Scale Figure',
    category: 'anime-figures',
    basePrice: 149.99,
    inventory: 10,
    badge: 'new' as const,
    scale: '1/7',
    material: 'PVC, ABS',
    dimensions: 'H approx. 24 cm',
    weight: '0.8 kg',
    blurb: 'A painted 1/7 scale figure on a display base.',
  },
  {
    key: 'chibi-mini',
    label: 'Chibi Mini Figure',
    category: 'chibi-minis',
    basePrice: 39.99,
    inventory: 25,
    badge: null,
    scale: 'Non-scale (approx. 10 cm)',
    material: 'PVC, ABS',
    dimensions: 'H approx. 10 cm',
    weight: '0.15 kg',
    blurb: 'A palm-sized chibi-style mini with swappable faces.',
  },
  {
    key: 'acrylic-stand',
    label: 'Acrylic Display Stand',
    category: 'accessories',
    basePrice: 19.99,
    inventory: 40,
    badge: null,
    scale: 'Universal',
    material: 'Acrylic',
    dimensions: 'H approx. 15 cm',
    weight: '0.1 kg',
    blurb: 'A printed acrylic stand with a clear base.',
  },
];

seedProducts.push(
  ...ANIME_SERIES.flatMap((series, si) =>
    SAMPLE_TEMPLATES.map((t, ti) => ({
      slug: `${series.slug}-${t.key}`,
      name: `${series.sampleLabel ?? series.name} ${t.label}`,
      category: t.category,
      brand: 'vault-select',
      franchise: series.name,
      sku: `NFV-S${String(si + 1).padStart(2, '0')}-${ti + 1}`,
      regularPrice: Math.round((t.basePrice + (si % 4) * (t.basePrice > 100 ? 10 : 2)) * 100) / 100,
      salePrice: null,
      inventory: t.inventory,
      badge: t.badge,
      releaseDate: '2026-10-01',
      scale: t.scale,
      material: t.material,
      dimensions: t.dimensions,
      weight: t.weight,
      featured: false,
      daysAgo: 1 + si,
      salesCount: 20 + ((si * 7 + ti * 13) % 40),
      shortDescription: `${series.name} — ${t.blurb}`,
      fullDescription: `Sample listing for the ${series.name} section of the shop. ${t.blurb} Replace the title, photos, price and specifications with your actual stock in Admin → Products.`,
      sample: true,
    })),
  ),
);

/** Pool of original example reviews, distributed deterministically across products. */
export const seedReviewPool: SeedReview[] = [
  { authorName: 'Mika T.', rating: 5, title: 'Even better in hand', body: 'Paint gradients are smooth and the sculpt holds up under close inspection. Arrived double-boxed without a scratch.' },
  { authorName: 'Jordan R.', rating: 4, title: 'Great centerpiece', body: 'Looks fantastic on my shelf. One peg was a little tight, but a hair dryer fixed it in seconds.' },
  { authorName: 'Sana K.', rating: 5, title: 'Worth the wait', body: 'The clear parts are crisp and there is no visible seam on the face. Easily one of my favorite pieces this year.' },
  { authorName: 'Leo M.', rating: 4, title: 'Solid quality', body: 'Good weight, stable base, and the colors match the promo shots closely. Would buy from this line again.' },
  { authorName: 'Priya D.', rating: 5, title: 'Packaging was perfect', body: 'Box art is gorgeous and everything was wrapped in foam. Shipping updates were clear the whole way.' },
  { authorName: 'Elliot W.', rating: 3, title: 'Nice, minor paint slop', body: 'Overall nice, but I spotted a small paint slip on the hem. Not noticeable from normal viewing distance.' },
  { authorName: 'Hana S.', rating: 5, title: 'The details!', body: 'Tiny details like the embroidery and buckles are fully painted. Photographs beautifully under LED light.' },
  { authorName: 'Marcus B.', rating: 4, title: 'Happy collector', body: 'Assembly took two minutes. The accessory parts swap easily and stay put.' },
  { authorName: 'Ava L.', rating: 5, title: 'Instant favorite', body: 'Bought it as a gift and ended up ordering a second one for myself. Customer support was quick and friendly.' },
  { authorName: 'Noah P.', rating: 4, title: 'Great value', body: 'For the price the build quality is excellent. Would love more alternate faces, but no real complaints.' },
  { authorName: 'Chloe N.', rating: 5, title: 'Stunning lighting', body: 'With a backlight the translucent parts glow beautifully. Exactly the look I wanted for my display.' },
  { authorName: 'Ibrahim A.', rating: 4, title: 'Sturdy and well made', body: 'No leaning after weeks on display. Base is heavy and the joints are tight.' },
];

/** Example reviews for the seed product at `index`. The store owner removed all sample reviews, so none are seeded. */
export function reviewsForSeedProduct(_index: number): SeedReview[] {
  return [];
}

/** Returns the example reviews assigned to the product at `index` (kept for reference; not seeded). */

export function reviewsForProduct(index: number): SeedReview[] {
  const count = 2 + (index % 3);
  return Array.from({ length: count }, (_, k) => seedReviewPool[(index * 5 + k * 3) % seedReviewPool.length]);
}

export const seedSettings: SiteSettings = {
  announcement: 'Free standard shipping on orders over $200 · Use WELCOME10 for 10% off your first order',
  storeEmail: 'hello@novafigurevault.example',
  storePhone: '+1 (555) 014-2290',
  storeAddress: '120 Collector Lane, Suite 4, Portland, OR 97201',
  currency: 'USD',
  shippingMessage: 'Orders ship within 2 business days. Preorders ship as soon as they arrive in our warehouse.',
};

/** Placeholder artwork paths (generated by scripts/build-seed.ts). */
export const placeholderProductPath = (slug: string, n: 1 | 2) => `/images/products/${slug}-${n}.svg`;
export const placeholderCategoryPath = (slug: string) => `/images/categories/${slug}.svg`;

/** Image URLs for a product: real photos imported from /photos when present, otherwise placeholders. */
export function productImagePaths(slug: string): string[] {
  const photos = photoManifest.products[slug];
  return photos?.length ? photos : [placeholderProductPath(slug, 1), placeholderProductPath(slug, 2)];
}
export const categoryImagePath = (slug: string) => photoManifest.categories[slug] ?? placeholderCategoryPath(slug);
export const heroImagePath = () => photoManifest.hero ?? '/images/hero/hero-figures.svg';
/** Real figure photos for the hero platforms (null when not imported). */
export const heroFigurePaths = () => photoManifest.heroFigures;
/** Looping background video for the home hero (null when not imported). */
export const homeVideoPath = () => photoManifest.homeVideo;
export const communityImagePath = (i: number) => photoManifest.community[i] ?? `/images/community/shelf-${i + 1}.svg`;
