// ============================================================================
// Browser-safe types + pure scoring logic for the FishAI daily report.
// Carried over verbatim from the Lovable project (src/lib/fishing.ts) so the
// report maths and data match it exactly. Pure data + math, no network.
// ============================================================================

export type GeoLocation = {
  label: string;
  latitude: number;
  longitude: number;
};

export type BiteHour = {
  /** ISO start time of the hour */
  time: string;
  /** Local hour label, e.g. "6 AM" */
  label: string;
  score: number;
  isPeak: boolean;
  isNow: boolean;
};

export type FishReport = {
  location: GeoLocation;
  updatedAt: string;
  localTime: string;
  timeZone: string;
  current: {
    tempF: number;
    condition: string;
    windMph: number;
    windDir: string;
    humidity: number;
    dewPointF: number;
    visibilityMi: number;
    pressureInHg: number;
    cloudCover: number;
    precipChance: number;
  };
  confidence: {
    score: number;
    label: string;
    summary: string;
    factors: { label: string; detail: string; positive: boolean }[];
  };
  pressure: {
    inHg: number;
    deltaMb: number;
    trend: 'Rising' | 'Falling' | 'Steady';
    note: string;
    series: number[];
  };
  biteWindow: {
    hours: BiteHour[];
    major: string;
    minor: string;
  };
  recommendation: {
    lure: string;
    lureId: string;
    color: string;
    why: string;
    species: string;
    match: number;
    retrieve: string;
    alternates: { lure: string; color: string; match: number }[];
  };
  preferences: {
    species: SpeciesId;
    tackle: LureId[];
  };
};

const CARDINAL: Record<string, string> = {
  NORTH: 'N',
  NORTH_NORTHEAST: 'NNE',
  NORTHEAST: 'NE',
  EAST_NORTHEAST: 'ENE',
  EAST: 'E',
  EAST_SOUTHEAST: 'ESE',
  SOUTHEAST: 'SE',
  SOUTH_SOUTHEAST: 'SSE',
  SOUTH: 'S',
  SOUTH_SOUTHWEST: 'SSW',
  SOUTHWEST: 'SW',
  WEST_SOUTHWEST: 'WSW',
  WEST: 'W',
  WEST_NORTHWEST: 'WNW',
  NORTHWEST: 'NW',
  NORTH_NORTHWEST: 'NNW',
};

export const cToF = (c: number) => Math.round((c * 9) / 5 + 32);
export const kmhToMph = (k: number) => Math.round(k * 0.621371);
export const kmToMi = (k: number) => Math.round(k * 0.621371);
export const mbToInHg = (mb: number) => Number((mb * 0.0295299830714).toFixed(2));
export const cardinal = (c?: string) => (c ? (CARDINAL[c] ?? c) : '--');

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Illuminated fraction 0..1 of the moon for a given date. */
export function moonIllumination(date: Date) {
  const synodic = 29.530588853;
  const known = Date.UTC(2000, 0, 6, 18, 14); // known new moon
  const days = (date.getTime() - known) / 86400000;
  const phase = ((days % synodic) + synodic) % synodic;
  const angle = (2 * Math.PI * phase) / synodic;
  return { phase: phase / synodic, illumination: (1 - Math.cos(angle)) / 2 };
}

type HourInput = {
  time: string;
  hourLocal: number;
  isDaytime: boolean;
  cloudCover: number;
  windMph: number;
  precipChance: number;
  pressureMb: number;
  tempF: number;
};

/** Score a single hour 0-100 for bite likelihood. */
export function scoreHour(h: HourInput, pressureDeltaMb: number, moonFactor: number) {
  let score = 42;

  // Low-light windows are the strongest driver.
  const distDawn = Math.min(Math.abs(h.hourLocal - 6), 24 - Math.abs(h.hourLocal - 6));
  const distDusk = Math.min(Math.abs(h.hourLocal - 19), 24 - Math.abs(h.hourLocal - 19));
  const lowLight = Math.min(distDawn, distDusk);
  score += Math.max(0, 26 - lowLight * 9);

  // Midday sun under clear skies slows things down.
  if (h.isDaytime && h.hourLocal >= 11 && h.hourLocal <= 15) score -= h.cloudCover < 40 ? 12 : 4;

  // Overcast helps fish roam.
  score += (h.cloudCover / 100) * 10;

  // Light chop is good, heavy wind is not.
  if (h.windMph >= 4 && h.windMph <= 12) score += 8;
  else if (h.windMph > 18) score -= 10;

  // Falling pressure ahead of a front fires up feeding.
  if (pressureDeltaMb <= -1.5) score += 10;
  else if (pressureDeltaMb >= 2) score -= 8;
  else score += 3;

  // Rain chance: light chance is fine, downpours are not.
  if (h.precipChance > 60) score -= 8;

  // Solunar influence from the moon.
  score += moonFactor * 8;

  return Math.round(clamp(score, 4, 98));
}

export function trendFromDelta(delta: number): FishReport['pressure']['trend'] {
  if (delta <= -0.8) return 'Falling';
  if (delta >= 0.8) return 'Rising';
  return 'Steady';
}

export function pressureNote(trend: FishReport['pressure']['trend']) {
  if (trend === 'Falling') return 'Falling ahead of a change — feeding usually turns on';
  if (trend === 'Rising') return 'Rising behind a front — expect a tighter, slower bite';
  return 'Steady over the last 12 hours — consistent, predictable feeding';
}

export function confidenceLabel(score: number) {
  if (score >= 75) return 'High';
  if (score >= 55) return 'Moderate';
  if (score >= 38) return 'Fair';
  return 'Tough';
}

/* ------------------------------------------------------------------ */
/* Species + tackle preferences                                        */
/* ------------------------------------------------------------------ */

export const SPECIES = [
  { id: 'largemouth', name: 'Largemouth Bass', tempIdeal: 72, clarityBias: 0 },
  { id: 'smallmouth', name: 'Smallmouth Bass', tempIdeal: 66, clarityBias: 1 },
  { id: 'walleye', name: 'Walleye', tempIdeal: 60, clarityBias: -1 },
  { id: 'pike', name: 'Northern Pike', tempIdeal: 62, clarityBias: 1 },
  { id: 'trout', name: 'Trout', tempIdeal: 55, clarityBias: 1 },
  { id: 'crappie', name: 'Crappie & Panfish', tempIdeal: 68, clarityBias: 0 },
  { id: 'catfish', name: 'Catfish', tempIdeal: 78, clarityBias: -1 },
  { id: 'striper', name: 'Striped Bass', tempIdeal: 65, clarityBias: 0 },
] as const;

export type SpeciesId = (typeof SPECIES)[number]['id'];

type LureDef = {
  id: string;
  name: string;
  colors: { bright: string; low: string };
  retrieve: string;
  /** Ideal water/air temperature band in °F */
  temp: [number, number];
  /** 1 = shines in low light, -1 = better in bright light, 0 = neutral */
  light: number;
  /** 1 = likes wind/chop, -1 = wants slick calm */
  wind: number;
  /** Reaction baits get a boost on falling pressure */
  reaction: boolean;
  species: SpeciesId[];
};

export const LURES = [
  {
    id: 'spinnerbait',
    name: 'Spinnerbait',
    colors: { bright: 'White / Silver', low: 'White / Chartreuse' },
    retrieve: 'Steady slow-roll along cover edges',
    temp: [55, 80],
    light: 1,
    wind: 1,
    reaction: true,
    species: ['largemouth', 'smallmouth', 'pike', 'striper'],
  },
  {
    id: 'lipless',
    name: 'Lipless Crankbait',
    colors: { bright: 'Sexy Shad', low: 'Chartreuse Shad' },
    retrieve: 'Rip-and-pause over grass and flats',
    temp: [48, 78],
    light: 0,
    wind: 1,
    reaction: true,
    species: ['largemouth', 'smallmouth', 'walleye', 'striper'],
  },
  {
    id: 'squarebill',
    name: 'Squarebill Crankbait',
    colors: { bright: 'Citrus Shad', low: 'Chartreuse Black Back' },
    retrieve: 'Deflect off rock, wood and dock posts',
    temp: [55, 82],
    light: 0,
    wind: 1,
    reaction: true,
    species: ['largemouth', 'smallmouth'],
  },
  {
    id: 'jerkbait',
    name: 'Jerkbait',
    colors: { bright: 'Ghost Minnow', low: 'Chrome / Blue' },
    retrieve: 'Twitch-twitch-pause, long pauses in cold water',
    temp: [38, 62],
    light: -1,
    wind: 0,
    reaction: true,
    species: ['smallmouth', 'largemouth', 'walleye', 'trout', 'striper'],
  },
  {
    id: 'topwater',
    name: 'Walking Topwater',
    colors: { bright: 'Bone', low: 'Black' },
    retrieve: 'Walk the dog across calm surface',
    temp: [65, 88],
    light: 1,
    wind: -1,
    reaction: true,
    species: ['largemouth', 'smallmouth', 'pike', 'striper'],
  },
  {
    id: 'softplastic',
    name: 'Weightless Soft Plastic',
    colors: { bright: 'Green Pumpkin', low: 'Junebug' },
    retrieve: 'Dead-stick and shake through shade lines',
    temp: [62, 92],
    light: -1,
    wind: -1,
    reaction: false,
    species: ['largemouth', 'smallmouth', 'crappie'],
  },
  {
    id: 'texascraw',
    name: 'Texas-Rigged Craw',
    colors: { bright: 'Green Pumpkin', low: 'Black / Blue' },
    retrieve: 'Pitch to isolated cover, hop and hold',
    temp: [50, 90],
    light: 0,
    wind: 0,
    reaction: false,
    species: ['largemouth', 'catfish', 'smallmouth'],
  },
  {
    id: 'jig',
    name: 'Football Jig',
    colors: { bright: 'Green Pumpkin Craw', low: 'Black / Blue' },
    retrieve: 'Drag slowly across hard bottom',
    temp: [42, 75],
    light: 0,
    wind: 0,
    reaction: false,
    species: ['largemouth', 'smallmouth', 'walleye'],
  },
  {
    id: 'dropshot',
    name: 'Drop Shot',
    colors: { bright: 'Morning Dawn', low: 'Smoke Purple' },
    retrieve: 'Shake in place over suspended fish',
    temp: [40, 80],
    light: -1,
    wind: -1,
    reaction: false,
    species: ['smallmouth', 'largemouth', 'crappie', 'walleye'],
  },
  {
    id: 'swimbait',
    name: 'Paddle Tail Swimbait',
    colors: { bright: 'Pearl Shad', low: 'Albino Shad' },
    retrieve: 'Steady mid-column swim through bait',
    temp: [50, 85],
    light: 0,
    wind: 0,
    reaction: true,
    species: ['largemouth', 'smallmouth', 'walleye', 'striper', 'pike'],
  },
  {
    id: 'livebaitrig',
    name: 'Live Bait Rig',
    colors: { bright: 'Natural Minnow', low: 'Nightcrawler' },
    retrieve: 'Slow troll or drift near bottom',
    temp: [38, 85],
    light: 0,
    wind: 0,
    reaction: false,
    species: ['walleye', 'catfish', 'crappie', 'trout'],
  },
  {
    id: 'inlinespinner',
    name: 'Inline Spinner',
    colors: { bright: 'Silver Blade', low: 'Gold Blade' },
    retrieve: 'Steady upstream cast and retrieve',
    temp: [42, 72],
    light: 1,
    wind: 0,
    reaction: true,
    species: ['trout', 'crappie', 'smallmouth', 'pike'],
  },
] as const satisfies readonly LureDef[];

export type LureId = (typeof LURES)[number]['id'];

export const DEFAULT_SPECIES: SpeciesId = 'largemouth';
export const DEFAULT_TACKLE: LureId[] = LURES.map((l) => l.id);

export function speciesName(id: SpeciesId) {
  return SPECIES.find((s) => s.id === id)?.name ?? 'Bass';
}

export function timeOfDayBand(hourLocal: number, isDaytime: boolean) {
  if (hourLocal >= 4 && hourLocal < 8) return 'dawn';
  if (hourLocal >= 8 && hourLocal < 11) return 'morning';
  if (hourLocal >= 11 && hourLocal < 16) return 'midday';
  if (hourLocal >= 16 && hourLocal < 21) return 'evening';
  return isDaytime ? 'morning' : 'night';
}

export function recommendLure(input: {
  tempF: number;
  cloudCover: number;
  windMph: number;
  trend: FishReport['pressure']['trend'];
  isDaytime: boolean;
  hourLocal: number;
  species: SpeciesId;
  tackle: LureId[];
}): FishReport['recommendation'] {
  const { tempF, cloudCover, windMph, trend, isDaytime, hourLocal, species } = input;
  const band = timeOfDayBand(hourLocal, isDaytime);
  const lowLight = band === 'dawn' || band === 'evening' || band === 'night' || cloudCover > 70;
  const owned = input.tackle.length ? input.tackle : DEFAULT_TACKLE;
  const pool = LURES.filter((l) => owned.includes(l.id));
  const candidates = (pool.length ? pool : LURES) as readonly LureDef[];
  const target = SPECIES.find((s) => s.id === species);

  const scored = candidates
    .map((l) => {
      let s = 50;

      // Species match is the heaviest weighting.
      if (l.species.includes(species)) s += 22;
      else s -= 18;

      // Temperature band fit.
      const [lo, hi] = l.temp;
      if (tempF >= lo && tempF <= hi) s += 14;
      else s -= Math.min(20, Math.abs(tempF < lo ? lo - tempF : tempF - hi) * 0.9);

      // Time of day and light.
      s += l.light * (lowLight ? 12 : -8);
      if (band === 'midday' && !l.reaction) s += 6;
      if (band === 'midday' && l.id === 'topwater') s -= 14;
      if ((band === 'dawn' || band === 'evening') && l.reaction) s += 8;
      if (band === 'night' && (l.id === 'topwater' || l.id === 'texascraw' || l.id === 'jig')) s += 6;

      // Wind and pressure.
      s += l.wind * (windMph >= 10 ? 9 : windMph <= 4 ? -7 : 0);
      if (trend === 'Falling' && l.reaction) s += 9;
      if (trend === 'Rising' && !l.reaction) s += 7;

      // Species that prefer stained/low-visibility water like flash and thump.
      if (target && target.clarityBias < 0 && l.reaction) s += 4;

      return { lure: l, match: Math.round(Math.max(5, Math.min(99, s))) };
    })
    .sort((a, b) => b.match - a.match);

  const best = scored[0]!;
  const color = lowLight ? best.lure.colors.low : best.lure.colors.bright;

  const reasons: string[] = [];
  reasons.push(
    lowLight
      ? `${band === 'night' ? 'Dark' : 'Low-light'} conditions with ${cloudCover}% cloud cover`
      : `Bright ${band} light with ${cloudCover}% cloud cover`,
  );
  reasons.push(`${tempF}°F and ${trend.toLowerCase()} pressure`);
  reasons.push(windMph >= 10 ? `${windMph} mph wind putting bait on the bank` : `${windMph} mph wind`);

  return {
    lure: best.lure.name,
    lureId: best.lure.id,
    color,
    species: speciesName(species),
    match: best.match,
    retrieve: best.lure.retrieve,
    why: `${reasons.join(', ')} — a strong ${speciesName(species).toLowerCase()} setup. ${best.lure.retrieve}.`,
    alternates: scored.slice(1, 3).map((s) => ({
      lure: s.lure.name,
      color: lowLight ? s.lure.colors.low : s.lure.colors.bright,
      match: s.match,
    })),
  };
}
