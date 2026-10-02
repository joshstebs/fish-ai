// FishAI merch catalog — prices in CAD.
// Payment links are NOT live yet: MERCH_PAYMENT_LINKS holds clearly-marked
// placeholders the parent fills in after Stripe payment links are created.

export type MerchCategory = 'tee' | 'hoodie' | 'hat';

export interface MerchProduct {
  id: string;
  title: string;
  category: MerchCategory;
  priceCad: number;
  image: string;
  story: string;
  sizes: string[];
  sizeNote?: string;
}

export const CATEGORY_LABELS: Record<MerchCategory, string> = {
  tee: 'T-shirts',
  hoodie: 'Hoodies',
  hat: 'Trucker Hats',
};

const APPAREL_SIZES = ['S', 'M', 'L', 'XL', '2XL'];

function p(
  id: string,
  title: string,
  category: MerchCategory,
  priceCad: number,
  story: string,
  sizeNote?: string,
): MerchProduct {
  return {
    id,
    title,
    category,
    priceCad,
    image: `/merch/${id}.jpg`,
    story,
    sizes: category === 'hat' ? ['One size'] : APPAREL_SIZES,
    sizeNote,
  };
}

export const MERCH_PRODUCTS: MerchProduct[] = [
  // ---- T-shirts ($39.99) ----
  p('tee-lake-ontario-forever', 'Lake Ontario Forever Tee', 'tee', 39.99,
    'The flagship. Born from a joke, perfected pixel by pixel — because around here the lake isn\u2019t a place you visit, it\u2019s a place you belong.'),
  p('tee-winter-is-biting', 'Winter Is Biting Tee', 'tee', 39.99,
    'A crowned walleye on a throne of rods and oars, ravens circling overhead. For the ones who drill holes while everyone else stays inside.'),
  p('tee-walleye-after-dark', 'Walleye After Dark Tee', 'tee', 39.99,
    'The night shift. Low-light hunters, glowing eyes, ripples on black water — built for the after-hours bite.'),
  p('tee-great-lakes-smallmouth', 'Great Lakes Smallmouth Tee', 'tee', 39.99,
    'Bronze bruisers of the Great Lakes. All the fight of a fish twice its size.'),
  p('tee-muskie-hunter', 'Muskie Hunter Tee', 'tee', 39.99,
    'The fish of 10,000 casts, earned one cast at a time. A vintage badge for the patient ones who hunt Ontario\u2019s apex predator.'),
  p('tee-ice-hole-bandit', 'Ice Hole Bandit Tee', 'tee', 39.99,
    'Watch your tip-up — this masked bandit has sticky paws and zero remorse. A hardwater-season original for ice anglers with a sense of humour.'),
  p('tee-ontario-slam', 'The Ontario Slam Tee', 'tee', 39.99,
    'Five species, one province, zero excuses. Walleye, smallmouth, muskie, pike and laker — the checklist for anglers working through the whole list.'),
  p('tee-reel-therapy', 'Reel Therapy Tee', 'tee', 39.99,
    'Cheaper than therapy, and the office has better views. Prescription: lures, hooks, weight, calm, line, chill — repeat as needed.'),
  p('tee-fishai-brand-lockup', 'FishAI Brand Lockup Tee', 'tee', 39.99,
    'The official FishAI lockup. Fly the flag for the app that makes every cast smarter.'),
  p('tee-bucketmouth', 'Bucketmouth Tee', 'tee', 39.99,
    'All mouth, all attitude. The bucketmouth doesn\u2019t ask permission.'),
  p('tee-chrome-steelhead', 'Chrome Steelhead Tee', 'tee', 39.99,
    'Great Lakes chrome. Fresh-run steelhead, silver as a new reel.'),
  // ---- Hoodies ($69.99) ----
  p('hoodie-lake-ontario-forever', 'Lake Ontario Forever Hoodie', 'hoodie', 69.99,
    'The flagship design on heavy fleece. For dawn launches when the air bites harder than the fish.'),
  p('hoodie-winter-is-biting', 'Winter Is Biting Hoodie', 'hoodie', 69.99,
    'Crowned walleye, throne of rods, ravens overhead — now on the only layer that matters in February.'),
  p('hoodie-walleye-after-dark', 'Walleye After Dark Hoodie', 'hoodie', 69.99,
    'Night-bite uniform. The glowing-eye walleye keeps watch while you wait out the last light.'),
  p('hoodie-muskie-hunter', 'Muskie Hunter Hoodie', 'hoodie', 69.99,
    'Ten thousand casts takes all day. Stay warm for every one of them.'),
  p('hoodie-great-lakes-smallmouth', 'Great Lakes Smallmouth Hoodie', 'hoodie', 69.99,
    'Bronze-bruiser energy, fleece-lined. Built for big-water mornings.'),
  // ---- Trucker hats ($34.99) ----
  p('hat-fishai-brand-lockup', 'FishAI Trucker Hat', 'hat', 34.99,
    'The FishAI lockup up front where it belongs. Foam front, mesh back, endless sky.',
    'Adjustable snapback — one size fits most'),
  p('hat-lake-ontario-forever', 'Lake Ontario Forever Trucker Hat', 'hat', 34.99,
    'The flagship mark, lake-ready. Shade your eyes, keep your bearings.',
    'Adjustable snapback — one size fits most'),
  p('hat-winter-is-biting', 'Winter Is Biting Trucker Hat', 'hat', 34.99,
    'Crowned walleye energy for the hardwater season. The fish may be under ice; your head stays warm-ish.',
    'Adjustable snapback — one size fits most'),
];

// ---------------------------------------------------------------------------
// Stripe payment links — PLACEHOLDERS. The parent fills these in after the
// Stripe payment links are created in the FishAI Stripe account. The Shop UI
// renders the Buy button regardless; placeholder links open a Stripe "not
// found" page, so replace every value before announcing the shop publicly.
// ---------------------------------------------------------------------------
export const MERCH_PAYMENT_LINKS: Record<string, string> = {
  'tee-lake-ontario-forever': 'https://buy.stripe.com/PLACEHOLDER-tee-lake-ontario-forever',
  'tee-winter-is-biting': 'https://buy.stripe.com/PLACEHOLDER-tee-winter-is-biting',
  'tee-walleye-after-dark': 'https://buy.stripe.com/PLACEHOLDER-tee-walleye-after-dark',
  'tee-great-lakes-smallmouth': 'https://buy.stripe.com/PLACEHOLDER-tee-great-lakes-smallmouth',
  'tee-muskie-hunter': 'https://buy.stripe.com/PLACEHOLDER-tee-muskie-hunter',
  'tee-ice-hole-bandit': 'https://buy.stripe.com/PLACEHOLDER-tee-ice-hole-bandit',
  'tee-ontario-slam': 'https://buy.stripe.com/PLACEHOLDER-tee-ontario-slam',
  'tee-reel-therapy': 'https://buy.stripe.com/PLACEHOLDER-tee-reel-therapy',
  'tee-fishai-brand-lockup': 'https://buy.stripe.com/PLACEHOLDER-tee-fishai-brand-lockup',
  'tee-bucketmouth': 'https://buy.stripe.com/PLACEHOLDER-tee-bucketmouth',
  'tee-chrome-steelhead': 'https://buy.stripe.com/PLACEHOLDER-tee-chrome-steelhead',
  'hoodie-lake-ontario-forever': 'https://buy.stripe.com/PLACEHOLDER-hoodie-lake-ontario-forever',
  'hoodie-winter-is-biting': 'https://buy.stripe.com/PLACEHOLDER-hoodie-winter-is-biting',
  'hoodie-walleye-after-dark': 'https://buy.stripe.com/PLACEHOLDER-hoodie-walleye-after-dark',
  'hoodie-muskie-hunter': 'https://buy.stripe.com/PLACEHOLDER-hoodie-muskie-hunter',
  'hoodie-great-lakes-smallmouth': 'https://buy.stripe.com/PLACEHOLDER-hoodie-great-lakes-smallmouth',
  'hat-fishai-brand-lockup': 'https://buy.stripe.com/PLACEHOLDER-hat-fishai-brand-lockup',
  'hat-lake-ontario-forever': 'https://buy.stripe.com/PLACEHOLDER-hat-lake-ontario-forever',
  'hat-winter-is-biting': 'https://buy.stripe.com/PLACEHOLDER-hat-winter-is-biting',
};

export function paymentLinkFor(productId: string): string {
  return MERCH_PAYMENT_LINKS[productId] ?? '#';
}

export function isPlaceholderLink(url: string): boolean {
  return url.includes('PLACEHOLDER');
}

export function formatCad(n: number): string {
  return `$${n.toFixed(2)} CAD`;
}
