// ============================================================================
// PERSONAL LEARNING LOOP — analyzes the user's OWN catch history to find
// patterns: best hours, best lures, best spots, best conditions, PBs.
// Every insight carries its sample size so the UI can show honest confidence.
// ============================================================================
import { CatchLogItem, InsightsReport, PatternInsight, SpeciesStat } from '../types/catchLogTypes';

const SPECIES_ALIASES: Record<string, string> = {
  largemouth: 'Largemouth Bass',
  'largemouth bass': 'Largemouth Bass',
  smallmouth: 'Smallmouth Bass',
  'smallmouth bass': 'Smallmouth Bass',
  trout: 'Trout',
  rainbow: 'Rainbow Trout',
  'rainbow trout': 'Rainbow Trout',
  brown: 'Brown Trout',
  pike: 'Northern Pike',
  'northern pike': 'Northern Pike',
  walleye: 'Walleye',
  bass: 'Bass',
  catfish: 'Catfish',
  muskie: 'Muskellunge',
  musky: 'Muskellunge',
  perch: 'Yellow Perch',
  crappie: 'Crappie',
  bluegill: 'Bluegill',
  salmon: 'Salmon',
  'red drum': 'Red Drum',
  redfish: 'Red Drum',
  snook: 'Snook',
  tarpon: 'Tarpon',
};

export function normalizeSpecies(species: string): string {
  const s = species.trim().toLowerCase();
  return SPECIES_ALIASES[s] || species.trim();
}

/** Best-fit single species label for a catch row. */
export function speciesOf(c: CatchLogItem): string {
  return normalizeSpecies(c.commonName || c.species.split('(')[0].trim());
}

/** Parse "4.2 lbs avg" / "2.8 - 4.8 lbs (1.3 - 2.2 kg)" style strings to a number. */
export function parseWeightLbs(s: string | undefined): number | null {
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)\s*(?:-|–)\s*(\d+(?:\.\d+)?)\s*lbs/);
  if (m) return (parseFloat(m[1]) + parseFloat(m[2])) / 2;
  const m2 = s.match(/~?(\d+(?:\.\d+)?)\s*lbs/);
  return m2 ? parseFloat(m2[1]) : null;
}

export function parseLengthInches(s: string | undefined): number | null {
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)\s*(?:-|–)\s*(\d+(?:\.\d+)?)\s*in/);
  if (m) return (parseFloat(m[1]) + parseFloat(m[2])) / 2;
  const m2 = s.match(/(\d+(?:\.\d+)?)\s*in/);
  return m2 ? parseFloat(m2[1]) : null;
}

function confidenceFor(n: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (n >= 5) return 'HIGH';
  if (n >= 3) return 'MEDIUM';
  return 'LOW';
}

export function analyzeCatches(catches: CatchLogItem[]): InsightsReport {
  const empty: InsightsReport = {
    speciesStats: [],
    personalBests: [],
    bestHourRange: '—',
    bestLure: null,
    bestSpot: null,
    bestSkyCondition: null,
    bestPressureRange: '—',
    patterns: [],
    totalCatches: 0,
    speciesCount: 0,
  };
  if (catches.length === 0) return empty;

  const bySpecies = new Map<string, CatchLogItem[]>();
  for (const c of catches) {
    const s = speciesOf(c);
    if (!bySpecies.has(s)) bySpecies.set(s, []);
    bySpecies.get(s)!.push(c);
  }

  // Species stats + personal bests
  const speciesStats: SpeciesStat[] = [];
  const personalBests: InsightsReport['personalBests'] = [];
  for (const [name, list] of bySpecies) {
    const weights = list.map((c) => parseWeightLbs(c.estimatedWeight)).filter((w): w is number => w !== null);
    const lengths = list.map((c) => parseLengthInches(c.estimatedLength)).filter((l): l is number => l !== null);
    const baitCounts = new Map<string, number>();
    const spotCounts = new Map<string, number>();
    for (const c of list) {
      if (c.baitUsed) baitCounts.set(c.baitUsed, (baitCounts.get(c.baitUsed) || 0) + 1);
      if (c.locationName) spotCounts.set(c.locationName, (spotCounts.get(c.locationName) || 0) + 1);
    }
    const topBait = [...baitCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const topSpot = [...spotCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    speciesStats.push({
      commonName: name,
      count: list.length,
      avgWeightLbs: weights.length ? Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10 : null,
      biggestWeightLbs: weights.length ? Math.max(...weights) : null,
      longestInches: lengths.length ? Math.round(Math.max(...lengths) * 10) / 10 : null,
      topBait,
      topSpot,
    });
    const best = list
      .map((c) => ({ c, w: parseWeightLbs(c.estimatedWeight) }))
      .filter((x): x is { c: CatchLogItem; w: number } => x.w !== null)
      .sort((a, b) => b.w - a.w)[0];
    if (best) personalBests.push({ commonName: name, weightLbs: best.w, catch: best.c });
  }
  personalBests.sort((a, b) => b.weightLbs - a.weightLbs);

  // Best hour bucket (6-9 AM style)
  const hourCounts = new Map<number, number>();
  for (const c of catches) {
    const h = new Date(c.timestamp).getHours();
    hourCounts.set(h, (hourCounts.get(h) || 0) + 1);
  }
  const bestHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  let bestHourRange = '—';
  if (bestHour) {
    const h = bestHour[0];
    const fmt = (x: number) => {
      const ampm = x >= 12 ? 'PM' : 'AM';
      const hh = x % 12 === 0 ? 12 : x % 12;
      return `${hh} ${ampm}`;
    };
    bestHourRange = `${fmt(h)} – ${fmt((h + 2) % 24)}`;
  }

  // Best lure
  const lureCounts = new Map<string, number>();
  for (const c of catches) {
    if (!c.baitUsed || c.baitUsed === 'Unspecified Bait') continue;
    lureCounts.set(c.baitUsed, (lureCounts.get(c.baitUsed) || 0) + 1);
  }
  const bestLureEntry = [...lureCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const bestLure = bestLureEntry ? { name: bestLureEntry[0], catches: bestLureEntry[1] } : null;

  // Best spot
  const spotCounts = new Map<string, number>();
  for (const c of catches) {
    if (!c.locationName) continue;
    spotCounts.set(c.locationName, (spotCounts.get(c.locationName) || 0) + 1);
  }
  const bestSpotEntry = [...spotCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const bestSpot = bestSpotEntry ? { name: bestSpotEntry[0], catches: bestSpotEntry[1] } : null;

  // Best sky condition (from weather snapshots)
  const skyCounts = new Map<string, number>();
  for (const c of catches) {
    const cond = c.weather?.condition;
    if (!cond) continue;
    const key = cond.toLowerCase().includes('clear') || cond.toLowerCase().includes('sunny')
      ? 'Sunny / Clear'
      : cond.toLowerCase().includes('overcast') || cond.toLowerCase().includes('cloud')
      ? 'Cloudy / Overcast'
      : cond.toLowerCase().includes('rain')
      ? 'Rain'
      : cond.toLowerCase().includes('drizzle')
      ? 'Drizzle'
      : cond.toLowerCase().includes('snow')
      ? 'Snow'
      : cond;
    skyCounts.set(key, (skyCounts.get(key) || 0) + 1);
  }
  const bestSkyEntry = [...skyCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const bestSkyCondition = bestSkyEntry ? { condition: bestSkyEntry[0], catches: bestSkyEntry[1] } : null;

  // Best pressure range
  const pressureBuckets = new Map<string, number>();
  for (const c of catches) {
    const p = c.weather?.barometricPressureInHg;
    if (!p) continue;
    const key = p < 29.7 ? 'Low (<29.7)' : p < 30.0 ? 'Mid (29.7–30.0)' : 'High (>30.0)';
    pressureBuckets.set(key, (pressureBuckets.get(key) || 0) + 1);
  }
  const bestPressureEntry = [...pressureBuckets.entries()].sort((a, b) => b[1] - a[1])[0];
  const bestPressureRange = bestPressureEntry ? bestPressureEntry[0] : '—';

  // Pattern insights (only when sample size is meaningful)
  const patterns: PatternInsight[] = [];
  if (bestHour && bestHour[1] >= 2) {
    patterns.push({
      id: 'best-hour',
      title: `Your best window is ${bestHourRange}`,
      detail: `${bestHour[1]} of your ${catches.length} catches happened in this 2-hour window.`,
      emoji: '🕐',
      sampleSize: bestHour[1],
      confidence: confidenceFor(bestHour[1]),
    });
  }
  if (bestLure && bestLure.catches >= 2) {
    patterns.push({
      id: 'best-lure',
      title: `Your top lure: ${bestLure.name}`,
      detail: `${bestLure.catches} catches on this presentation — ${Math.round((bestLure.catches / catches.length) * 100)}% of your total.`,
      emoji: '🎣',
      sampleSize: bestLure.catches,
      confidence: confidenceFor(bestLure.catches),
    });
  }
  if (bestSpot && bestSpot.catches >= 2) {
    patterns.push({
      id: 'best-spot',
      title: `Your most productive spot: ${bestSpot.name}`,
      detail: `${bestSpot.catches} catches logged there (${Math.round((bestSpot.catches / catches.length) * 100)}% of total).`,
      emoji: '📍',
      sampleSize: bestSpot.catches,
      confidence: confidenceFor(bestSpot.catches),
    });
  }
  if (bestSkyCondition && bestSkyCondition.catches >= 2) {
    patterns.push({
      id: 'best-sky',
      title: `You catch more in: ${bestSkyCondition.condition}`,
      detail: `${bestSkyCondition.catches} of your catches came under ${bestSkyCondition.condition.toLowerCase()} conditions.`,
      emoji: '🌤️',
      sampleSize: bestSkyCondition.catches,
      confidence: confidenceFor(bestSkyCondition.catches),
    });
  }
  if (bestPressureEntry && bestPressureEntry[1] >= 2) {
    patterns.push({
      id: 'best-pressure',
      title: `Your best pressure: ${bestPressureRange}`,
      detail: `${bestPressureEntry[1]} catches came when pressure was ${bestPressureRange.toLowerCase()}.`,
      emoji: '📉',
      sampleSize: bestPressureEntry[1],
      confidence: confidenceFor(bestPressureEntry[1]),
    });
  }
  // Multi-species milestone
  if (speciesStats.length >= 3) {
    patterns.push({
      id: 'species-diversity',
      title: `You've caught ${speciesStats.length} different species`,
      detail: speciesStats.map((s) => s.commonName).join(', ') + '.',
      emoji: '🐟',
      sampleSize: speciesStats.length,
      confidence: 'HIGH',
    });
  }

  return {
    speciesStats,
    personalBests,
    bestHourRange,
    bestLure,
    bestSpot,
    bestSkyCondition,
    bestPressureRange,
    patterns,
    totalCatches: catches.length,
    speciesCount: speciesStats.length,
  };
}
