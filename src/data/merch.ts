// FishAI merch catalog — prices in CAD.
// Stripe payment links — live.

export type MerchCategory = 'tee' | 'hoodie' | 'hat';

export interface MerchProduct {
  id: string;
  title: string;
  category: MerchCategory;
  priceCad: number;
  image: string;
  imageBack?: string;
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
  p('tee-tables-have-turned', 'The Tables Have Turned Tee', 'tee', 39.99,
    'Revenge is best served cold — straight out of the livewell. A walleye in a boat, rod in one fin and a beer in the other, fishing for humans. The comedy flagship.'),
  p('tee-slab-season', 'Slab Season Tee', 'tee', 39.99,
    'Spring means one thing: slabs. A black crappie badge for the panfish crowd chasing dinner-plate slabs across the Great Lakes.'),
  p('tee-king-of-the-pier', 'King of the Pier Tee', 'tee', 39.99,
    'Chinook. Lake Ontario. The pier at dawn. For the salmon anglers who know the king doesn\u2019t come to you — you go to the king.'),
  {
    ...p('tee-lake-ontario-forever-protest', 'Lake Ontario Forever Protest Tee', 'tee', 39.99,
      'Front: the flagship Lake Ontario Forever badge, lighthouse and all. Back: the quiet part out loud, a full-back protest print on the same cream blank. For everyone who knows exactly which lake this is.'),
    imageBack: '/merch/tee-lake-ontario-forever-protest-back.jpg',
  },
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
  'tee-lake-ontario-forever': 'https://buy.stripe.com/dRmdRa1oc6J10F4gen1Jm00',
  'tee-winter-is-biting': 'https://buy.stripe.com/3cI3cw2sg5EX73saU31Jm01',
  'tee-walleye-after-dark': 'https://buy.stripe.com/7sY28s1oc4AT0F4aU31Jm02',
  'tee-great-lakes-smallmouth': 'https://buy.stripe.com/00w8wQ0k87N5evUaU31Jm03',
  'tee-muskie-hunter': 'https://buy.stripe.com/4gM6oIc2Q7N52Nc7HR1Jm04',
  'tee-ice-hole-bandit': 'https://buy.stripe.com/9B64gA7MAd7pbjI8LV1Jm05',
  'tee-ontario-slam': 'https://buy.stripe.com/dRmdRa5Es3wPafE0fp1Jm06',
  'tee-reel-therapy': 'https://buy.stripe.com/bJe9AUff2d7pcnM6DN1Jm07',
  'tee-fishai-brand-lockup': 'https://buy.stripe.com/fZu28sff27N54Vke6f1Jm08',
  'tee-bucketmouth': 'https://buy.stripe.com/8x228s2sggjB2Nce6f1Jm09',
  'tee-chrome-steelhead': 'https://buy.stripe.com/8x24gA3wk0kDgE26DN1Jm0a',
  'tee-tables-have-turned': 'https://buy.stripe.com/fZudRa4Aoffx1J86DN1Jm0j',
  'tee-slab-season': 'https://buy.stripe.com/00w8wQ5Es2sL9bAd2b1Jm0k',
  'tee-king-of-the-pier': 'https://buy.stripe.com/28E00k5Es4AT4Vk0fp1Jm0l',
  'tee-lake-ontario-forever-protest': 'https://buy.stripe.com/PLACEHOLDER-tee-lake-ontario-forever-protest',
  'hoodie-lake-ontario-forever': 'https://buy.stripe.com/cNi28s9UI9VdfzY1jt1Jm0b',
  'hoodie-winter-is-biting': 'https://buy.stripe.com/8x24gA3wk5EXgE22nx1Jm0c',
  'hoodie-walleye-after-dark': 'https://buy.stripe.com/4gMcN6d6U4AT0F48LV1Jm0d',
  'hoodie-muskie-hunter': 'https://buy.stripe.com/4gM5kE9UI8R9evU1jt1Jm0e',
  'hoodie-great-lakes-smallmouth': 'https://buy.stripe.com/00w00k4Ao6J1afE6DN1Jm0f',
  'hat-fishai-brand-lockup': 'https://buy.stripe.com/3cI28saYMebt1J88LV1Jm0g',
  'hat-lake-ontario-forever': 'https://buy.stripe.com/5kQ9AU0k82sLevUfaj1Jm0h',
  'hat-winter-is-biting': 'https://buy.stripe.com/5kQ3cw9UI0kDgE29PZ1Jm0i',
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
