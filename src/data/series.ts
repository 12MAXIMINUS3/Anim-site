/**
 * Anime series the store carries. A product belongs to a series when its
 * `franchise` field matches `name` exactly (set it in Admin → Products).
 * Edit this list to add or remove series from the home page, menus and filters.
 */
export interface Series {
  slug: string;
  name: string;
  /** Two accent colors for the text-based tile. */
  colors: [string, string];
  /** Prefix for sample listing names (defaults to `name`). */
  sampleLabel?: string;
}

export const ANIME_SERIES: Series[] = [
  { slug: 'attack-on-titan', name: 'Attack on Titan', colors: ['#7c2d12', '#a16207'] },
  { slug: 'black-clover', name: 'Black Clover', colors: ['#14532d', '#0f172a'] },
  { slug: 'bleach', name: 'Bleach', colors: ['#1e293b', '#ea580c'] },
  { slug: 'demon-slayer', name: 'Demon Slayer', colors: ['#065f46', '#9f1239'] },
  { slug: 'dragon-ball', name: 'Dragon Ball', colors: ['#c2410c', '#1d4ed8'] },
  { slug: 'jujutsu-kaisen', name: 'Jujutsu Kaisen', colors: ['#312e81', '#0e7490'] },
  { slug: 'my-hero-academia', name: 'My Hero Academia', colors: ['#15803d', '#b91c1c'] },
  { slug: 'naruto-boruto', name: 'Naruto / Boruto', colors: ['#ea580c', '#1e3a8a'] },
  { slug: 'one-piece', name: 'One Piece', colors: ['#b91c1c', '#ca8a04'] },
  { slug: 'vinland-saga', name: 'Vinland Saga', colors: ['#334155', '#0369a1'] },
  { slug: 'yu-gi-oh', name: 'Yu-Gi-Oh!', colors: ['#6d28d9', '#b45309'] },
  { slug: 'sailor-moon', name: 'Sailor Moon', colors: ['#7c3aed', '#ec4899'] },
  { slug: 'fruits-basket', name: 'Fruits Basket', colors: ['#c2410c', '#65a30d'] },
  { slug: 'cardcaptor-sakura', name: 'Cardcaptor Sakura', colors: ['#be185d', '#0891b2'] },
  { slug: 'uncategorized', name: 'Uncategorized', colors: ['#3f3f46', '#7c3aed'], sampleLabel: 'Assorted Anime' },
];

export const seriesHref = (s: Series) => `/shop?franchise=${encodeURIComponent(s.name)}`;

/** Series featured on the three platforms of the home hero banner (left, centre, right). */
export const HERO_SERIES = ['fruits-basket', 'sailor-moon', 'cardcaptor-sakura'] as const;
