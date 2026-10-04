/**
 * Procedural, ORIGINAL anime-style collectible figure artwork (SVG).
 *
 * Every character is generated from a seed: hair style/colour, eyes, outfit,
 * pose, accessory and base vary per product. The designs are generic and are
 * not based on any existing anime, game or franchise character.
 *
 * All drawing happens in an 800×1000 coordinate space with the figure's base
 * centred around (400, 800).
 */

export type FigureKind = 'figure' | 'statue' | 'chibi' | 'action';

// ─────────────────────────────── utilities ────────────────────────────────

export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: string) {
  let s = hash(seed) || 1;
  const next = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
  return {
    next,
    pick: <T,>(list: readonly T[]): T => list[Math.floor(next() * list.length) % list.length],
    range: (a: number, b: number) => a + next() * (b - a),
  };
}

/** Lightens (amt > 0) or darkens (amt < 0) a #rrggbb colour. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt))));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const f = (n: number) => n.toFixed(1);

// ─────────────────────────────── palettes ─────────────────────────────────

const HAIR = ['#2a2140', '#f2cf6b', '#e9677f', '#7cc8f2', '#b9a6f7', '#f08a3e', '#e8e6f0', '#1f2a44', '#3ccf9a', '#f27aa8', '#8a5cf0', '#5b8def', '#c0392b', '#6b4a3a'];
const EYES = ['#7c3aed', '#0ea5e9', '#dc2626', '#16a34a', '#f59e0b', '#db2777', '#0891b2', '#9333ea'];
const OUTFIT = [
  ['#2b2a6b', '#e8c46a'],
  ['#7a1f3d', '#f3e3c3'],
  ['#1d4e5f', '#9be7f0'],
  ['#f4f1fb', '#7c3aed'],
  ['#1f1f2e', '#e2445c'],
  ['#3b2f7a', '#f0abfc'],
  ['#0f5132', '#facc15'],
  ['#8b2c14', '#fde68a'],
  ['#24324f', '#7dd3fc'],
  ['#5b2161', '#fbcfe8'],
] as const;
const SKIN = ['#fde4d6', '#f8d5c2', '#f1c3a6', '#d9a37f', '#b07a56'];

type HairStyle = 'long' | 'twintails' | 'ponytail' | 'bob' | 'spiky';
type Outfit = 'gown' | 'skirt' | 'coat' | 'armor';
type Accessory = 'sword' | 'staff' | 'orb' | 'fan' | 'book' | 'shuriken' | 'axe' | 'card' | 'basket' | 'none';
type HeadPiece = 'ribbon' | 'pin' | 'ears' | 'tiara' | 'headband' | 'plate' | 'tricorn' | 'helmet' | 'none';
type Expression = 'smile' | 'open' | 'calm' | 'wink';

interface Character {
  hair: string;
  hairStyle: HairStyle;
  hairLen: number;
  eyes: string;
  skin: string;
  outfit: Outfit;
  primary: string;
  secondary: string;
  accessory: Accessory;
  headPiece: HeadPiece;
  expression: Expression;
  armAngle: number; // degrees, raised arm
  cape: boolean;
  wings: boolean;
  fx: string; // effect colour
  scarf: string | null;
  shield: boolean;
  aura: boolean;
  giant: boolean; // looming silhouette in the background
  trim: boolean; // wave trim on coat hem
  orbitCards: boolean; // glowing cards circling the figure
  magicCircle: boolean; // glowing geometric circle behind the figure
}

/**
 * Genre themes for the anime-series sections of the shop. Each is an ORIGINAL
 * archetype (soldier, mage, ninja, pirate…) with colours, hair and outfits
 * deliberately chosen NOT to resemble any existing character from that series.
 */
export const SERIES_THEMES: Record<string, Partial<Character>> = {
  // field soldier with a looming giant silhouette in the background
  'attack-on-titan': { hair: '#a0522d', hairStyle: 'ponytail', outfit: 'coat', primary: '#3d5a6c', secondary: '#c9b37e', accessory: 'sword', headPiece: 'none', giant: true, fx: '#e2a35a' },
  // young mage with a star-emblem spell book
  'black-clover': { hair: '#c26b2f', hairStyle: 'twintails', outfit: 'gown', primary: '#1f5f5b', secondary: '#e6c35c', accessory: 'book', headPiece: 'pin', cape: true, fx: '#7ef0c8' },
  // spirit swordsman with a pale-blue glow
  bleach: { hair: '#d9dde8', hairStyle: 'long', outfit: 'coat', primary: '#26355e', secondary: '#9fb8e8', accessory: 'sword', headPiece: 'none', fx: '#9fd8ff' },
  // hunter in an indigo coat with wave trim and a flame-effect blade
  'demon-slayer': { hair: '#1f4f5a', hairStyle: 'bob', outfit: 'coat', primary: '#3b3f8f', secondary: '#e8eef5', accessory: 'sword', headPiece: 'none', trim: true, fx: '#ff8a3d' },
  // martial artist powering up with an energy aura
  'dragon-ball': { hair: '#e98bb5', hairStyle: 'ponytail', outfit: 'coat', primary: '#5b3a8c', secondary: '#f2e6c9', accessory: 'none', headPiece: 'headband', aura: true, armAngle: -120, fx: '#62e38a' },
  // student sorcerer holding a glowing energy orb
  'jujutsu-kaisen': { hair: '#2f5d3a', hairStyle: 'bob', outfit: 'coat', primary: '#6b1f2e', secondary: '#d4b06a', accessory: 'orb', headPiece: 'none', fx: '#a35cff' },
  // caped hero-in-training in a power pose
  'my-hero-academia': { hair: '#1b1b24', hairStyle: 'bob', outfit: 'armor', primary: '#c62f3a', secondary: '#f3f4f6', accessory: 'none', headPiece: 'none', cape: true, aura: true, armAngle: -95, fx: '#ffd166' },
  // ninja with a plain metal-plate headband, scarf and throwing star
  'naruto-boruto': { hair: '#6b4fa8', hairStyle: 'ponytail', outfit: 'coat', primary: '#2f4a4a', secondary: '#9aa5b1', accessory: 'shuriken', headPiece: 'plate', scarf: '#d6c27a', fx: '#7ad3ff' },
  // pirate adventurer with a feathered tricorn and cutlass
  'one-piece': { hair: '#ece8e1', hairStyle: 'long', outfit: 'coat', primary: '#16606b', secondary: '#d9a441', accessory: 'sword', headPiece: 'tricorn', fx: '#ffd27a' },
  // Viking warrior with helmet, round shield and axe
  'vinland-saga': { hair: '#4a3226', hairStyle: 'long', outfit: 'coat', primary: '#6b4e32', secondary: '#b0b6bf', accessory: 'axe', headPiece: 'helmet', shield: true, fx: '#8fd3ff' },
  // card duelist with a glowing creature card
  'yu-gi-oh': { hair: '#b8a4f0', hairStyle: 'bob', outfit: 'coat', primary: '#eef0f6', secondary: '#6d4bd8', accessory: 'card', headPiece: 'none', fx: '#c084fc' },
  // starry magical guardian: long teal hair, violet gown, star staff (no buns, no sailor collar)
  'sailor-moon': { hair: '#5fc9c4', hairStyle: 'long', outfit: 'gown', primary: '#6d4bc9', secondary: '#f6e7a8', accessory: 'staff', headPiece: 'pin', expression: 'smile', fx: '#f9a8d4' },
  // gentle, cosy girl with a woven fruit basket (no zodiac animals, no ribbons)
  'fruits-basket': { hair: '#9ad7b0', hairStyle: 'bob', outfit: 'skirt', primary: '#e8916b', secondary: '#fbe7c6', accessory: 'basket', headPiece: 'none', expression: 'smile', armAngle: -40, fx: '#fdba74' },
  // card mage with glowing cards circling her (no winged star wand, no frilly hat)
  'cardcaptor-sakura': { hair: '#c8a2f0', hairStyle: 'twintails', eyes: '#d97706', outfit: 'skirt', primary: '#1f4e5a', secondary: '#f2c66d', accessory: 'staff', headPiece: 'none', expression: 'open', armAngle: -28, magicCircle: true, fx: '#f472b6' },
};

function makeCharacter(seed: string, kind: FigureKind, fx: string, theme?: Partial<Character>): Character {
  const r = rng(seed);
  const [primary, secondary] = r.pick(OUTFIT);
  const outfit: Outfit = kind === 'action' ? 'armor' : r.pick(['gown', 'skirt', 'skirt', 'coat'] as const);
  const hairStyle: HairStyle = kind === 'action' ? r.pick(['spiky', 'bob', 'ponytail'] as const) : r.pick(['long', 'twintails', 'ponytail', 'bob', 'long', 'spiky'] as const);
  const base: Character = {
    hair: r.pick(HAIR),
    hairStyle,
    hairLen: r.range(120, 300),
    eyes: r.pick(EYES),
    skin: r.pick(SKIN),
    outfit,
    primary,
    secondary,
    accessory: kind === 'action' ? r.pick(['sword', 'staff'] as const) : r.pick(['sword', 'staff', 'orb', 'fan', 'book', 'none'] as const),
    headPiece: kind === 'action' ? r.pick(['headband', 'none'] as const) : r.pick(['ribbon', 'pin', 'ears', 'tiara', 'headband', 'none'] as const),
    expression: r.pick(['smile', 'open', 'calm', 'wink'] as const),
    armAngle: r.range(-150, -35),
    cape: kind !== 'chibi' && r.next() < 0.35,
    wings: kind === 'statue' && r.next() < 0.6,
    fx,
    scarf: null,
    shield: false,
    aura: false,
    giant: false,
    trim: false,
    orbitCards: false,
    magicCircle: false,
  };
  const c: Character = theme ? { ...base, ...theme } : base;
  if (kind === 'chibi') c.cape = false;
  return c;
}

// ─────────────────────────────── head ─────────────────────────────────────

/** Back hair, drawn behind the body. Local coords: face centre (0,0). */
function backHair(c: Character, id: string): string {
  const L = c.hairLen;
  const fill = `url(#${id}-hair)`;
  switch (c.hairStyle) {
    case 'long':
      return `<path d="M-66 -18 C-84 -96 84 -96 66 -18 C86 50 ${f(92)} ${f(L * 0.6)} ${f(70)} ${f(L)} Q40 ${f(L + 30)} 18 ${f(L - 10)} L0 ${f(L + 14)} L-18 ${f(L - 10)} Q-40 ${f(L + 30)} -70 ${f(L)} C-92 ${f(L * 0.6)} -86 50 -66 -18Z" fill="${fill}"/>`;
    case 'twintails':
      return [-1, 1]
        .map(
          (s) =>
            `<path d="M${s * 52} -48 C${s * 120} -60 ${s * 128} 40 ${s * 110} ${f(L * 0.7)} C${s * 100} ${f(L)} ${s * 140} ${f(L + 20)} ${s * 120} ${f(L + 40)} C${s * 70} ${f(L)} ${s * 74} ${f(L * 0.5)} ${s * 62} 10Z" fill="${fill}"/>
             <circle cx="${s * 56}" cy="-50" r="11" fill="${c.secondary}"/>`,
        )
        .join('') + `<path d="M-64 -10 C-80 -96 80 -96 64 -10 L60 40 L-60 40Z" fill="${fill}"/>`;
    case 'ponytail':
      return `<path d="M30 -70 C110 -70 130 20 112 ${f(L * 0.6)} C104 ${f(L * 0.9)} 132 ${f(L)} 116 ${f(L + 30)} C78 ${f(L * 0.8)} 84 ${f(L * 0.4)} 60 -10Z" fill="${fill}"/>
        <circle cx="62" cy="-58" r="10" fill="${c.secondary}"/>
        <path d="M-64 -10 C-80 -96 80 -96 64 -10 L62 30 L-62 30Z" fill="${fill}"/>`;
    case 'bob':
      return `<path d="M-68 -12 C-84 -100 84 -100 68 -12 L74 52 Q66 78 44 72 L-44 72 Q-66 78 -74 52Z" fill="${fill}"/>`;
    case 'spiky':
      return `<path d="M-70 -6 L-96 -40 L-66 -54 L-84 -96 L-40 -82 L-34 -122 L0 -96 L30 -126 L40 -84 L86 -98 L66 -54 L98 -38 L70 -4 L76 40 L-76 40Z" fill="${fill}"/>`;
  }
}

function eye(id: string, side: -1 | 1, closed: boolean): string {
  if (closed) {
    return `<path d="M${side * 8} 4 Q${side * 21} 14 ${side * 34} 4" stroke="#2a1e3a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  }
  const x = side * 21;
  return `<g>
    <path d="M${side * 34} 2 Q${x} -14 ${side * 8} -2 Q${side * 9} 22 ${x} 27 Q${side * 33} 22 ${side * 34} 2Z" fill="#fff"/>
    <ellipse cx="${x}" cy="9" rx="11.5" ry="16" fill="url(#${id}-iris)"/>
    <ellipse cx="${x}" cy="11" rx="5.5" ry="8.5" fill="#160f24"/>
    <circle cx="${x - side * 4}" cy="2" r="4.6" fill="#fff"/>
    <circle cx="${x + side * 4}" cy="17" r="2.2" fill="#fff" opacity=".85"/>
    <path d="M${side * 37} 0 Q${x} -19 ${side * 6} -5" stroke="#1d1428" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <path d="M${side * 37} 0 l${side * 6} -5" stroke="#1d1428" stroke-width="3" stroke-linecap="round"/>
    <path d="M${side * 12} 25 Q${x} 29 ${side * 29} 23" stroke="#5a4366" stroke-width="1.4" fill="none" opacity=".6"/>
  </g>`;
}

/** Face, eyes, bangs and head accessory. Local coords: face centre (0,0). */
function head(c: Character, id: string): string {
  const skinShade = shade(c.skin, -0.12);
  const mouth =
    c.expression === 'open'
      ? `<path d="M-8 44 Q0 58 8 44Z" fill="#b4475a"/><path d="M-5 50 Q0 54 5 50" stroke="#f59ab0" stroke-width="2" fill="none"/>`
      : c.expression === 'calm'
        ? `<path d="M-6 47 L6 47" stroke="#9a4a56" stroke-width="2.2" stroke-linecap="round"/>`
        : `<path d="M-8 45 Q0 52 8 45" stroke="#9a4a56" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  const headPiece = (() => {
    switch (c.headPiece) {
      case 'ribbon':
        return `<g transform="translate(44 -70) rotate(18)"><path d="M0 0 L-26 -16 L-22 14Z M0 0 L26 -16 L22 14Z" fill="${c.secondary}"/><circle r="7" fill="${shade(c.secondary, -0.2)}"/></g>`;
      case 'pin':
        return `<path d="M-50 -52 l6 -14 l6 14 l14 2 l-11 9 l4 14 l-13 -8 l-13 8 l4 -14 l-11 -9Z" fill="${c.secondary}" stroke="#fff" stroke-opacity=".5"/>`;
      case 'ears':
        return `<path d="M-60 -60 L-48 -118 L-18 -84Z" fill="url(#${id}-hair)"/><path d="M-50 -68 L-44 -104 L-28 -84Z" fill="#f9b4c6"/>
          <path d="M60 -60 L48 -118 L18 -84Z" fill="url(#${id}-hair)"/><path d="M50 -68 L44 -104 L28 -84Z" fill="#f9b4c6"/>`;
      case 'tiara':
        return `<path d="M-40 -78 L-30 -98 L-16 -84 L0 -106 L16 -84 L30 -98 L40 -78Z" fill="#f5d77a" stroke="#fff6cf" stroke-width="1.5"/><circle cx="0" cy="-90" r="5" fill="${c.eyes}"/>`;
      case 'headband':
        return `<path d="M-64 -40 Q0 -86 64 -40" stroke="${c.secondary}" stroke-width="9" fill="none"/>`;
      case 'plate':
        return `<path d="M-66 -38 Q0 -84 66 -38" stroke="${c.secondary}" stroke-width="13" fill="none"/>
          <rect x="-22" y="-76" width="44" height="22" rx="4" fill="#cfd6de" stroke="#7d8a99" stroke-width="2"/>
          <path d="M62 -40 C84 -30 96 -10 104 10 M62 -44 C90 -40 108 -26 120 -8" stroke="${c.secondary}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      case 'tricorn':
        return `<path d="M-96 -66 Q0 -34 96 -66 L66 -98 Q0 -150 -66 -98Z" fill="#1d1d2a"/>
          <path d="M-96 -66 Q0 -34 96 -66" stroke="${c.secondary}" stroke-width="4" fill="none"/>
          <path d="M30 -118 C70 -150 110 -130 120 -100 C96 -116 64 -118 36 -104Z" fill="#f2efe8" opacity=".9"/>`;
      case 'helmet':
        return `<path d="M-68 -34 C-68 -122 68 -122 68 -34Z" fill="${c.secondary}"/>
          <path d="M-68 -34 L68 -34" stroke="${shade(c.secondary, -0.35)}" stroke-width="6"/>
          <path d="M0 -112 L0 -34" stroke="${shade(c.secondary, -0.25)}" stroke-width="5"/>
          <rect x="-5" y="-38" width="10" height="34" rx="3" fill="${shade(c.secondary, -0.2)}"/>
          ${[-48, -24, 24, 48].map((x) => `<circle cx="${x}" cy="-44" r="3" fill="${shade(c.secondary, 0.4)}"/>`).join('')}`;
      default:
        return '';
    }
  })();
  const bangs =
    c.hairStyle === 'spiky'
      ? `<path d="M-64 -4 C-72 -74 -30 -92 0 -90 C30 -92 72 -74 64 -4 L52 -24 L44 8 L30 -30 L18 4 L4 -34 L-10 4 L-24 -32 L-36 6 L-48 -26Z" fill="url(#${id}-hair)"/>`
      : `<path d="M-62 -4 C-70 -72 -30 -90 0 -88 C30 -90 70 -72 62 -4 L54 0 L46 -26 L38 8 L26 -24 L14 4 L4 -30 L-8 6 L-18 -26 L-30 8 L-40 -24 L-50 2Z" fill="url(#${id}-hair)"/>
         <path d="M-62 -8 C-72 30 -68 74 -58 104 C-50 74 -48 30 -46 -2Z" fill="url(#${id}-hair)"/>
         <path d="M62 -8 C72 30 68 74 58 104 C50 74 48 30 46 -2Z" fill="url(#${id}-hair)"/>`;
  return `<g>
    <path d="M-52 -6 C-54 32 -30 62 0 72 C30 62 54 32 52 -6 C52 -60 -52 -60 -52 -6Z" fill="${c.skin}"/>
    <path d="M-52 -6 C-52 6 -46 14 -40 18 Q0 4 40 18 C46 14 52 6 52 -6 C40 -18 -40 -18 -52 -6Z" fill="${skinShade}" opacity=".55"/>
    <path d="M-34 -24 Q-22 -31 -10 -26" stroke="${shade(c.hair, -0.35)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M34 -24 Q22 -31 10 -26" stroke="${shade(c.hair, -0.35)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    ${eye(id, -1, false)}
    ${eye(id, 1, c.expression === 'wink')}
    <path d="M1 30 l2 5" stroke="${shade(c.skin, -0.3)}" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse cx="-31" cy="33" rx="9" ry="4" fill="#f58aa4" opacity=".45"/>
    <ellipse cx="31" cy="33" rx="9" ry="4" fill="#f58aa4" opacity=".45"/>
    ${mouth}
    ${bangs}
    <path d="M-40 -56 Q0 -74 40 -56" stroke="#fff" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${headPiece}
  </g>`;
}

// ─────────────────────────────── body ─────────────────────────────────────

function accessory(c: Character, id: string, hx: number, hy: number): string {
  switch (c.accessory) {
    case 'sword':
      return `<g transform="translate(${f(hx)} ${f(hy)}) rotate(${f(c.armAngle + 90)})">
        <rect x="-4" y="-210" width="8" height="200" rx="3" fill="url(#${id}-blade)"/>
        <rect x="-4" y="-210" width="8" height="200" rx="3" fill="${c.fx}" opacity=".35" filter="url(#${id}-soft)"/>
        <rect x="-22" y="-12" width="44" height="8" rx="3" fill="${c.secondary}"/>
        <rect x="-4" y="-4" width="8" height="34" rx="3" fill="${shade(c.primary, -0.3)}"/>
      </g>`;
    case 'staff':
      return `<g>
        <line x1="${f(hx)}" y1="${f(hy + 150)}" x2="${f(hx)}" y2="${f(hy - 170)}" stroke="${shade(c.secondary, -0.25)}" stroke-width="7" stroke-linecap="round"/>
        <circle cx="${f(hx)}" cy="${f(hy - 186)}" r="20" fill="${c.fx}" opacity=".9"/>
        <circle cx="${f(hx)}" cy="${f(hy - 186)}" r="40" fill="${c.fx}" opacity=".35" filter="url(#${id}-soft)"/>
        <path d="M${f(hx - 22)} ${f(hy - 170)} Q${f(hx)} ${f(hy - 220)} ${f(hx + 22)} ${f(hy - 170)}" stroke="${c.secondary}" stroke-width="4" fill="none"/>
      </g>`;
    case 'orb':
      return `<circle cx="${f(hx)}" cy="${f(hy - 40)}" r="26" fill="${c.fx}" opacity=".85"/>
        <circle cx="${f(hx)}" cy="${f(hy - 40)}" r="56" fill="${c.fx}" opacity=".3" filter="url(#${id}-soft)"/>
        <circle cx="${f(hx - 8)}" cy="${f(hy - 48)}" r="7" fill="#fff" opacity=".8"/>`;
    case 'fan':
      return `<path d="M${f(hx)} ${f(hy)} L${f(hx - 60)} ${f(hy - 70)} A90 90 0 0 1 ${f(hx + 60)} ${f(hy - 70)}Z" fill="${c.secondary}" stroke="${shade(c.secondary, -0.3)}" stroke-width="2"/>
        ${[-40, -20, 0, 20, 40].map((d) => `<line x1="${f(hx)}" y1="${f(hy)}" x2="${f(hx + d * 1.4)}" y2="${f(hy - 86 + Math.abs(d) * 0.35)}" stroke="${shade(c.secondary, -0.35)}" stroke-width="1.5"/>`).join('')}`;
    case 'book':
      return `<g transform="translate(${f(hx)} ${f(hy - 20)}) rotate(-12)"><rect x="-30" y="-22" width="60" height="44" rx="4" fill="${c.secondary}"/><rect x="-26" y="-18" width="52" height="36" rx="2" fill="#f8f4e8"/><line x1="0" y1="-18" x2="0" y2="18" stroke="#c9bfa5" stroke-width="2"/><circle cx="0" cy="-34" r="16" fill="${c.fx}" opacity=".5" filter="url(#${id}-soft)"/></g>`;
    case 'shuriken':
      return `<g transform="translate(${f(hx)} ${f(hy - 34)}) rotate(20)">
        <path d="M0 -28 L7 -7 L28 0 L7 7 L0 28 L-7 7 L-28 0 L-7 -7Z" fill="#d3dbe5" stroke="#7d8a99" stroke-width="2"/>
        <circle r="5" fill="#5b6675"/>
        <circle r="34" fill="${c.fx}" opacity=".25" filter="url(#${id}-soft)"/>
      </g>`;
    case 'axe':
      return `<line x1="${f(hx - 6)}" y1="${f(hy + 70)}" x2="${f(hx + 12)}" y2="${f(hy - 130)}" stroke="#5a3d28" stroke-width="8" stroke-linecap="round"/>
        <path d="M${f(hx + 10)} ${f(hy - 126)} Q${f(hx + 66)} ${f(hy - 140)} ${f(hx + 72)} ${f(hy - 90)} Q${f(hx + 40)} ${f(hy - 96)} ${f(hx + 8)} ${f(hy - 84)}Z" fill="#cfd6de" stroke="#7d8a99" stroke-width="2"/>`;
    case 'basket':
      return `<g transform="translate(${f(hx)} ${f(hy + 18)})">
        <path d="M-40 -6 Q0 -60 40 -6" stroke="#8a5a2b" stroke-width="5" fill="none"/>
        <circle cx="-16" cy="-12" r="13" fill="#ef4444"/><circle cx="12" cy="-14" r="12" fill="#f59e0b"/><circle cx="-2" cy="-22" r="11" fill="#84cc16"/>
        <path d="M-12 -32 q4 -8 10 -6" stroke="#4d7c0f" stroke-width="3" fill="none"/>
        <path d="M-44 -6 L44 -6 L34 34 L-34 34Z" fill="#b7793b"/>
        ${[-28, -14, 0, 14, 28].map((x) => `<line x1="${x}" y1="-6" x2="${x * 0.78}" y2="34" stroke="#8a5a2b" stroke-width="2"/>`).join('')}
        ${[4, 14, 24].map((y) => `<line x1="-40" y1="${y}" x2="40" y2="${y}" stroke="#8a5a2b" stroke-width="2" opacity=".7"/>`).join('')}
      </g>`;
    case 'card':
      return `<g transform="translate(${f(hx)} ${f(hy - 52)}) rotate(-10)">
        <rect x="-44" y="-58" width="88" height="116" rx="8" fill="${c.fx}" opacity=".35" filter="url(#${id}-soft)"/>
        <rect x="-26" y="-36" width="52" height="72" rx="5" fill="#2a1f4a" stroke="${c.fx}" stroke-width="3"/>
        <rect x="-19" y="-28" width="38" height="34" rx="3" fill="${c.fx}" opacity=".7"/>
        <path d="M-6 -11 L0 -22 L6 -11 L0 0Z" fill="#fff" opacity=".85"/>
        <rect x="-19" y="12" width="38" height="16" rx="2" fill="#f1ecff" opacity=".8"/>
      </g>`;
    default:
      return '';
  }
}

/** Full-body scale figure (also used for statues and action figures). */
function fullBody(c: Character, id: string, kind: FigureKind): string {
  const armor = c.outfit === 'armor';
  const shoulderL = { x: 344, y: 408 };
  const shoulderR = { x: 456, y: 408 };
  const rad = (c.armAngle * Math.PI) / 180;
  const elbow = { x: shoulderR.x + 62 * Math.cos(rad + 0.5), y: shoulderR.y + 62 * Math.sin(rad + 0.5) };
  const hand = { x: elbow.x + 70 * Math.cos(rad), y: elbow.y + 70 * Math.sin(rad) };
  const stance = armor ? 34 : 0;

  const legs =
    c.outfit === 'gown'
      ? ''
      : [-1, 1]
          .map((s) => {
            const x = 400 + s * (24 + stance * 0.6);
            const footX = 400 + s * (28 + stance);
            const legFill = c.outfit === 'coat' || armor ? shade(c.primary, -0.35) : '#1f1a2e';
            return `<path d="M${f(x - 15)} 610 L${f(x + 15)} 610 L${f(footX + 12)} 770 L${f(footX - 12)} 770Z" fill="${legFill}"/>
              <path d="M${f(footX - 16)} 718 L${f(footX + 16)} 718 L${f(footX + 18)} 788 Q${f(footX)} 796 ${f(footX - 22)} 790Z" fill="${shade(c.secondary, -0.45)}"/>
              ${armor ? `<circle cx="${f((x + footX) / 2)}" cy="690" r="13" fill="${c.secondary}" stroke="${shade(c.secondary, -0.4)}" stroke-width="2"/>` : ''}`;
          })
          .join('');

  const lower = (() => {
    switch (c.outfit) {
      case 'gown':
        return `<path d="M362 520 C322 600 272 712 246 792 Q400 822 554 792 C528 712 478 600 438 520Z" fill="url(#${id}-cloth)"/>
          ${[300, 350, 400, 450, 500].map((x) => `<path d="M${400 + (x - 400) * 0.18} 540 Q${x} 680 ${x + (x - 400) * 0.15} 800" stroke="${shade(c.primary, -0.35)}" stroke-width="3" fill="none" opacity=".45"/>`).join('')}
          <path d="M246 792 Q400 822 554 792" stroke="${c.secondary}" stroke-width="6" fill="none"/>`;
      case 'skirt':
        return `<path d="M360 520 C332 566 304 612 292 646 Q400 672 508 646 C496 612 468 566 440 520Z" fill="url(#${id}-cloth)"/>
          ${[330, 365, 400, 435, 470].map((x) => `<path d="M${400 + (x - 400) * 0.3} 524 L${x + (x - 400) * 0.25} 656" stroke="${shade(c.primary, -0.35)}" stroke-width="2.5" opacity=".5"/>`).join('')}
          <path d="M292 646 Q400 672 508 646" stroke="${c.secondary}" stroke-width="5" fill="none"/>`;
      case 'coat':
        return `<path d="M352 470 C320 600 300 700 292 770 L372 770 L388 540 L412 540 L428 770 L508 770 C500 700 480 600 448 470Z" fill="url(#${id}-cloth)"/>
          <path d="M388 540 L372 770 M412 540 L428 770" stroke="${c.secondary}" stroke-width="4"/>`;
      case 'armor':
        return `<path d="M356 516 L444 516 L462 600 L338 600Z" fill="${shade(c.primary, -0.2)}"/>
          <path d="M356 516 L444 516 L452 556 L348 556Z" fill="${c.secondary}" opacity=".85"/>`;
    }
  })();

  const torso = `<path d="M338 412 Q350 394 374 390 L426 390 Q450 394 462 412 L454 470 Q442 506 442 522 L358 522 Q358 506 346 470Z" fill="url(#${id}-cloth)"/>
    <path d="M374 390 L400 436 L426 390" fill="${c.secondary}" opacity=".9"/>
    <path d="M378 390 L400 428 L422 390" fill="${c.skin}"/>
    <rect x="354" y="508" width="92" height="16" rx="4" fill="${c.secondary}"/>
    <rect x="392" y="506" width="16" height="20" rx="3" fill="${shade(c.secondary, -0.35)}"/>
    ${armor ? `<path d="M352 430 L448 430 L440 486 L360 486Z" fill="${shade(c.primary, 0.15)}" stroke="${c.secondary}" stroke-width="3"/><circle cx="400" cy="456" r="10" fill="${c.fx}"/><circle cx="400" cy="456" r="22" fill="${c.fx}" opacity=".35" filter="url(#${id}-soft)"/>` : `<path d="M368 450 Q400 462 432 450" stroke="${shade(c.primary, -0.35)}" stroke-width="2.5" fill="none" opacity=".6"/>`}`;

  const shoulderPads = armor
    ? `<ellipse cx="${shoulderL.x - 4}" cy="${shoulderL.y - 2}" rx="30" ry="22" fill="${c.secondary}" stroke="${shade(c.secondary, -0.4)}" stroke-width="2"/>
       <ellipse cx="${shoulderR.x + 4}" cy="${shoulderR.y - 2}" rx="30" ry="22" fill="${c.secondary}" stroke="${shade(c.secondary, -0.4)}" stroke-width="2"/>`
    : '';

  const sleeve = shade(c.primary, -0.1);
  const leftArm = `<path d="M${shoulderL.x} ${shoulderL.y} Q318 470 328 548" stroke="${sleeve}" stroke-width="26" fill="none" stroke-linecap="round"/>
    <circle cx="328" cy="556" r="12" fill="${c.skin}"/>
    ${armor ? `<circle cx="326" cy="476" r="11" fill="${c.secondary}" stroke="${shade(c.secondary, -0.4)}" stroke-width="2"/>` : ''}`;
  const rightArm = `<path d="M${shoulderR.x} ${shoulderR.y} L${f(elbow.x)} ${f(elbow.y)} L${f(hand.x)} ${f(hand.y)}" stroke="${sleeve}" stroke-width="24" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${f(hand.x)}" cy="${f(hand.y)}" r="12" fill="${c.skin}"/>
    ${armor ? `<circle cx="${f(elbow.x)}" cy="${f(elbow.y)}" r="11" fill="${c.secondary}" stroke="${shade(c.secondary, -0.4)}" stroke-width="2"/>` : ''}`;

  const cape = c.cape
    ? `<path d="M346 404 C300 520 250 660 214 780 Q330 800 400 760 Q470 800 586 780 C550 660 500 520 454 404Z" fill="${shade(c.secondary, -0.45)}"/>
       <path d="M346 404 C300 520 250 660 214 780" stroke="${c.secondary}" stroke-width="3" fill="none" opacity=".7"/>`
    : '';

  const wings = c.wings
    ? [-1, 1]
        .map((s) =>
          [0, 1, 2, 3, 4]
            .map((i) => `<ellipse cx="${400 + s * (90 + i * 34)}" cy="${430 - i * 26}" rx="${70 - i * 6}" ry="22" transform="rotate(${s * (-25 - i * 14)} ${400 + s * (90 + i * 34)} ${430 - i * 26})" fill="${c.fx}" opacity="${f(0.55 - i * 0.07)}"/>`)
            .join(''),
        )
        .join('') + `<ellipse cx="400" cy="400" rx="230" ry="150" fill="${c.fx}" opacity=".18" filter="url(#${id}-soft)"/>`
    : '';

  const aura = c.aura
    ? `<path d="M400 150 C290 230 240 420 262 600 C278 712 330 790 400 806 C470 790 522 712 538 600 C560 420 510 230 400 150Z" fill="${c.fx}" opacity=".22" filter="url(#${id}-soft)"/>
       <path d="M400 168 C306 246 262 420 280 596 C294 700 340 776 400 790 C460 776 506 700 520 596 C538 420 494 246 400 168Z" fill="none" stroke="${c.fx}" stroke-width="3" opacity=".55"/>`
    : '';
  const scarf = c.scarf
    ? `<path d="M370 392 Q400 414 430 392 L434 410 Q400 432 366 410Z" fill="${c.scarf}"/>
       <path d="M424 404 C470 420 520 398 566 428 C524 446 470 446 422 424Z" fill="${shade(c.scarf, -0.15)}"/>`
    : '';
  const shield = c.shield
    ? `<circle cx="316" cy="540" r="58" fill="${shade(c.primary, -0.25)}" stroke="${c.secondary}" stroke-width="7"/>
       <path d="M316 482 L316 598 M258 540 L374 540" stroke="${shade(c.primary, -0.45)}" stroke-width="3"/>
       <circle cx="316" cy="540" r="13" fill="${c.secondary}"/>`
    : '';
  const trim =
    c.trim && c.outfit === 'coat'
      ? `<path d="M296 756 q17 -14 34 0 t34 0 t34 0 M436 756 q17 -14 34 0 t34 0" stroke="${c.secondary}" stroke-width="5" fill="none"/>`
      : '';

  const orbit = c.orbitCards
    ? [0, 1, 2, 3, 4, 5]
        .map((i) => {
          const a = (i / 6) * Math.PI * 2 + 0.4;
          const x = 400 + Math.cos(a) * 190;
          const y = 470 + Math.sin(a) * 120;
          return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f((a * 180) / Math.PI / 6 - 15)})">
            <rect x="-20" y="-30" width="40" height="60" rx="5" fill="${c.fx}" opacity=".3" filter="url(#${id}-soft)"/>
            <rect x="-15" y="-22" width="30" height="44" rx="4" fill="#1b1f3b" stroke="${c.fx}" stroke-width="2"/>
            <circle cx="0" cy="0" r="7" fill="none" stroke="${c.secondary}" stroke-width="2"/>
          </g>`;
        })
        .join('')
    : '';

  const circle = c.magicCircle
    ? (() => {
        const cx = 400;
        const cy = 470;
        const ring = (r: number, w: number, o: number) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c.fx}" stroke-width="${w}" opacity="${o}"/>`;
        const square = (rot: number) => `<rect x="${cx - 150}" y="${cy - 150}" width="300" height="300" fill="none" stroke="${c.fx}" stroke-width="2.5" opacity=".7" transform="rotate(${rot} ${cx} ${cy})"/>`;
        const ticks = Array.from({ length: 36 }, (_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const r1 = 238;
          const r2 = i % 3 === 0 ? 256 : 248;
          return `<line x1="${f(cx + Math.cos(a) * r1)}" y1="${f(cy + Math.sin(a) * r1)}" x2="${f(cx + Math.cos(a) * r2)}" y2="${f(cy + Math.sin(a) * r2)}" stroke="${c.fx}" stroke-width="2" opacity=".75"/>`;
        }).join('');
        const nodes = [0, 1, 2, 3, 4, 5]
          .map((i) => {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(a) * 196;
            const y = cy + Math.sin(a) * 196;
            return `<circle cx="${f(x)}" cy="${f(y)}" r="20" fill="#1a0f24" stroke="${c.fx}" stroke-width="2.5" opacity=".9"/><circle cx="${f(x)}" cy="${f(y)}" r="6" fill="${c.fx}" opacity=".85"/>`;
          })
          .join('');
        return `<g>
          <circle cx="${cx}" cy="${cy}" r="270" fill="${c.fx}" opacity=".12" filter="url(#${id}-soft)"/>
          ${ring(262, 4, 0.85)}${ring(232, 2, 0.6)}${ring(176, 3, 0.75)}${ring(110, 2, 0.5)}
          ${ticks}${square(0)}${square(45)}${nodes}
        </g>`;
      })()
    : '';

  return `<g>
    ${circle}
    ${aura}
    ${orbit}
    ${wings}
    <g transform="translate(400 300)">${backHair(c, id)}</g>
    ${cape}
    ${legs}
    ${lower}
    ${trim}
    ${leftArm}
    ${shield}
    <rect x="388" y="356" width="24" height="40" fill="${shade(c.skin, -0.08)}"/>
    ${torso}
    ${scarf}
    ${shoulderPads}
    <g transform="translate(400 300)">${head(c, id)}</g>
    ${rightArm}
    ${accessory(c, id, hand.x, hand.y)}
    ${kind === 'action' ? '' : ''}
  </g>`;
}

/** Chibi mini: big head, small body. */
function chibiBody(c: Character, id: string): string {
  const hand = { x: 470, y: 600 };
  return `<g>
    <g transform="translate(400 430) scale(1.9)">${backHair({ ...c, hairLen: Math.min(c.hairLen, 160) * 0.7 }, id)}</g>
    <path d="M372 700 L370 778 Q384 790 396 780 L396 700Z M404 700 L404 780 Q416 790 430 778 L428 700Z" fill="${shade(c.secondary, -0.45)}"/>
    <path d="M352 588 Q400 566 448 588 L462 712 Q400 728 338 712Z" fill="url(#${id}-cloth)"/>
    <rect x="350" y="650" width="100" height="12" rx="4" fill="${c.secondary}"/>
    <path d="M356 600 Q330 630 334 664" stroke="${shade(c.primary, -0.1)}" stroke-width="22" fill="none" stroke-linecap="round"/>
    <circle cx="334" cy="670" r="12" fill="${c.skin}"/>
    <path d="M444 600 Q462 600 ${hand.x} ${hand.y}" stroke="${shade(c.primary, -0.1)}" stroke-width="22" fill="none" stroke-linecap="round"/>
    <circle cx="${hand.x}" cy="${hand.y}" r="12" fill="${c.skin}"/>
    <g transform="translate(400 430) scale(1.9)">${head(c, id)}</g>
    ${c.accessory === 'none' ? '' : `<g transform="translate(${hand.x} ${hand.y}) scale(.55) translate(${-hand.x} ${-hand.y})">${accessory({ ...c, armAngle: -70 }, id, hand.x, hand.y)}</g>`}
  </g>`;
}

// ─────────────────────────────── bases ────────────────────────────────────

function pedestal(id: string, fx: string): string {
  return `<ellipse cx="400" cy="858" rx="236" ry="40" fill="#000" opacity=".5"/>
    <path d="M182 800 L182 836 Q400 880 618 836 L618 800Z" fill="url(#${id}-base)"/>
    <ellipse cx="400" cy="800" rx="218" ry="36" fill="#262038"/>
    <ellipse cx="400" cy="800" rx="218" ry="36" fill="none" stroke="${fx}" stroke-opacity=".55" stroke-width="2.5"/>
    <ellipse cx="400" cy="800" rx="196" ry="28" fill="none" stroke="#fff" stroke-opacity=".06" stroke-width="8"/>`;
}

function sculptedBase(id: string, c: Character): string {
  const rocks = [250, 320, 400, 480, 550]
    .map((x, i) => `<path d="M${x - 50} 800 L${x - 30} ${760 - (i % 2) * 24} L${x + 6} ${748 - (i % 3) * 16} L${x + 44} 780 L${x + 50} 800Z" fill="${shade('#3a3352', (i % 2) * 0.12)}" stroke="#ffffff" stroke-opacity=".06"/>`)
    .join('');
  const crystals = [290, 520]
    .map((x) => `<path d="M${x} 790 L${x + 14} 730 L${x + 26} 790Z" fill="${c.fx}" opacity=".8"/><path d="M${x + 18} 792 L${x + 34} 752 L${x + 44} 794Z" fill="${c.fx}" opacity=".55"/>`)
    .join('');
  return `<ellipse cx="400" cy="866" rx="260" ry="42" fill="#000" opacity=".55"/>
    <path d="M160 800 L176 846 Q400 890 624 846 L640 800Z" fill="url(#${id}-base)"/>
    <ellipse cx="400" cy="800" rx="240" ry="38" fill="#221d33" stroke="${c.fx}" stroke-opacity=".4" stroke-width="2"/>
    ${rocks}
    ${crystals}`;
}

// ─────────────────────────────── public API ───────────────────────────────

/** Extra gradient/filter defs needed by a character. */
export function characterDefs(id: string, c: Character): string {
  return `<linearGradient id="${id}-hair" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${shade(c.hair, 0.25)}"/>
      <stop offset=".55" stop-color="${c.hair}"/>
      <stop offset="1" stop-color="${shade(c.hair, -0.4)}"/>
    </linearGradient>
    <radialGradient id="${id}-iris" cx="50%" cy="30%" r="70%">
      <stop offset="0" stop-color="${shade(c.eyes, -0.45)}"/>
      <stop offset=".6" stop-color="${c.eyes}"/>
      <stop offset="1" stop-color="${shade(c.eyes, 0.45)}"/>
    </radialGradient>
    <linearGradient id="${id}-cloth" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${shade(c.primary, 0.18)}"/>
      <stop offset=".6" stop-color="${c.primary}"/>
      <stop offset="1" stop-color="${shade(c.primary, -0.4)}"/>
    </linearGradient>
    <linearGradient id="${id}-blade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="${c.fx}"/>
    </linearGradient>
    <filter id="${id}-soft" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="12"/></filter>`;
}

/**
 * Returns `{ defs, art }` for a figure. `art` is in the 800×1000 space;
 * `detail` zooms into the upper body for a second product angle.
 */
export interface DrawOptions {
  detail?: boolean;
  /** Series theme key from SERIES_THEMES. */
  theme?: string;
  /** Render as a chibi printed on a clear acrylic stand. */
  acrylic?: boolean;
}

export function drawFigure(kind: FigureKind, seed: string, id: string, baseFx: string, opts: DrawOptions = {}) {
  const r = rng(seed + ':fx');
  const theme = opts.theme ? SERIES_THEMES[opts.theme] : undefined;
  const c = makeCharacter(seed, kind, baseFx, theme);
  const fx = c.fx;
  const particles = Array.from({ length: 16 }, () => {
    const x = r.range(110, 690);
    const y = r.range(120, 720);
    const s = r.range(2, 6);
    return r.next() < 0.3
      ? `<path d="M${f(x)} ${f(y - s * 2)} L${f(x + s * 0.6)} ${f(y)} L${f(x)} ${f(y + s * 2)} L${f(x - s * 0.6)} ${f(y)}Z" fill="#fff" opacity="${f(r.range(0.4, 0.9))}"/>`
      : `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="${fx}" opacity="${f(r.range(0.25, 0.75))}"/>`;
  }).join('');

  let body: string;
  if (kind === 'chibi' && opts.acrylic) {
    body = `<ellipse cx="400" cy="846" rx="190" ry="26" fill="#000" opacity=".45"/>
      <rect x="236" y="168" width="328" height="640" rx="44" fill="#ffffff" opacity=".07" stroke="#e0e7ff" stroke-opacity=".6" stroke-width="3"/>
      ${chibiBody(c, id)}
      <path d="M262 200 L330 200 L262 300Z" fill="#fff" opacity=".12"/>
      <rect x="236" y="168" width="328" height="640" rx="44" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1"/>
      <rect x="250" y="804" width="300" height="30" rx="10" fill="#cfd8ff" opacity=".35" stroke="#e0e7ff" stroke-opacity=".6"/>
      <rect x="330" y="808" width="140" height="8" rx="4" fill="#fff" opacity=".35"/>`;
  } else if (kind === 'chibi') body = `${pedestal(id, fx)}${chibiBody(c, id)}`;
  else if (kind === 'statue') body = `${sculptedBase(id, c)}<g transform="translate(24 32) scale(.94)">${fullBody(c, id, kind)}</g>`;
  else body = `<g transform="translate(400 800) scale(1.12) translate(-400 -800)">${pedestal(id, fx)}${fullBody(c, id, kind)}</g>`;

  // Studio rim light + glow behind the figure.
  const backdrop = `<ellipse cx="400" cy="470" rx="250" ry="330" fill="${fx}" opacity=".14" filter="url(#${id}-soft)"/>
    <path d="M300 0 L500 0 L640 820 L160 820Z" fill="#fff" opacity=".025"/>
    ${c.giant ? `<path d="M560 110 C604 80 664 96 672 146 C680 186 652 206 642 226 L708 300 L728 600 L664 600 L644 380 L622 640 L520 640 L520 380 L500 600 L436 600 L470 300 L538 226 C518 206 508 164 560 110Z" fill="#05050a" opacity=".55" filter="url(#${id}-soft)"/>` : ''}`;

  const art = `${backdrop}<g>${body}</g>${particles}`;
  const framed = opts.detail
    ? `<g transform="translate(400 ${kind === 'chibi' ? 470 : 400}) scale(${kind === 'chibi' ? 1.55 : 1.75}) translate(-400 ${kind === 'chibi' ? -470 : -380})">${art}</g>`
    : art;
  return { defs: characterDefs(id, c), art: framed };
}
