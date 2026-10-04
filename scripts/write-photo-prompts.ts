/**
 * Writes photos/PROMPTS.md — one image-generation prompt per required photo,
 * with the exact file name to save it as. Built from src/data/seedProducts.ts,
 * so prompts always match the catalog.
 * Run with: npm run photos:prompts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedBrands, seedCategories, seedProducts, type SeedProduct } from '../src/data/seedProducts.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const STYLE =
  'Professional e-commerce product photograph, studio lighting, softbox key light with subtle purple and cyan rim light, ' +
  'shallow depth of field, sharp focus on the product, dark charcoal seamless backdrop, photorealistic, high detail, ' +
  'portrait 4:5 aspect ratio. Original character design that is NOT based on any existing anime, game, film or franchise. ' +
  'No text, no logos, no watermarks, no people, fully clothed, non-sexualized.';

const SUBJECT: Record<string, (p: SeedProduct) => string> = {
  'anime-figures': (p) => `a painted ${p.scale} scale anime-style PVC collectible figure on a round display base`,
  preorders: (p) => `a painted ${p.scale} scale anime-style PVC collectible figure prototype on a round display base`,
  statues: (p) => `a large ${p.scale} premium polystone collectible statue with an elaborate sculpted base`,
  'limited-editions': (p) => `a premium limited-edition ${p.scale} collectible figure on a lacquered numbered base`,
  'chibi-minis': () => 'a small chibi-style collectible mini figure with an oversized head and tiny body, about 10 cm tall, on a small clear stand',
  'action-figures': (p) => `a highly articulated ${p.scale} scale action figure with visible joints, posed dynamically`,
  'display-cases': () => 'a collector display case product shot',
  accessories: () => 'a collector accessory product shot',
};

const ALT_VIEW =
  'Alternate three-quarter angle view of the same product, showing side and back details, same lighting and backdrop.';

function productPrompt(p: SeedProduct, view: 1 | 2): string {
  const brand = seedBrands.find((b) => b.slug === p.brand)?.name ?? '';
  const subject = (SUBJECT[p.category] ?? SUBJECT['anime-figures'])(p);
  const detail = `${p.shortDescription} ${p.fullDescription.split('. ').slice(0, 2).join('. ')}.`;
  const mat = p.material ? ` Materials: ${p.material}.` : '';
  const viewText = view === 1 ? 'Front hero shot, product centered.' : ALT_VIEW;
  return `Product: "${p.name}" by the fictional brand ${brand}. Photograph of ${subject}. ${detail}${mat} ${viewText} ${STYLE}`;
}

const lines: string[] = [];
lines.push('# Nova Figure Vault — photo prompts');
lines.push('');
lines.push('Paste each prompt into your image generator (e.g. ChatGPT images), then save the result into this `photos` folder');
lines.push('using the **exact file name** shown (.png, .jpg or .webp all work). When done, run `npm run photos:import`.');
lines.push('');
lines.push('Tip: generate the `-1` image first, then ask for the `-2` image "of the same figure" in the same chat so both views match.');
lines.push('');

lines.push('## Home page');
lines.push('');
lines.push('**`hero.png`** (landscape 6:5)');
lines.push('');
lines.push(
  '> Three original anime-style collectible figures displayed together on glowing circular pedestals: a star-themed girl in a flowing indigo gown, an armored cyberpunk swordsman, and a cute chibi mini. ' +
    'Dark premium collector shelf, purple and cyan neon accent lighting, studio product photography, photorealistic, 6:5 aspect ratio. ' +
    'Original designs not based on any existing franchise. No text, no logos.',
);
lines.push('');
for (let i = 1; i <= 8; i++) {
  lines.push(`**\`community-${i}.png\`** (square)`);
  lines.push('');
  lines.push(
    `> A collector's home display shelf photo, variation ${i}: several original anime-style figures and chibi minis arranged in an acrylic display case with soft LED lighting, cozy room in the background slightly blurred. Square 1:1 photo, photorealistic. Original designs, no recognizable characters, no text, no logos, no people.`,
  );
  lines.push('');
}

lines.push('## Categories');
lines.push('');
for (const c of seedCategories) {
  lines.push(`**\`category-${c.slug}.png\`**`);
  lines.push('');
  lines.push(`> Category banner photo for "${c.name}": ${c.description} ${STYLE}`);
  lines.push('');
}

lines.push('## Products');
lines.push('');
for (const p of seedProducts) {
  lines.push(`### ${p.name}`);
  lines.push('');
  for (const view of [1, 2] as const) {
    lines.push(`**\`${p.slug}-${view}.png\`**`);
    lines.push('');
    lines.push(`> ${productPrompt(p, view)}`);
    lines.push('');
  }
}

mkdirSync(resolve(root, 'photos'), { recursive: true });
writeFileSync(resolve(root, 'photos/PROMPTS.md'), lines.join('\n'), 'utf8');
console.log(`Wrote photos/PROMPTS.md (${seedProducts.length * 2 + seedCategories.length + 9} prompts).`);
