// ============================================================================
// TODAY'S FISH REPORT — honest conditions scoring.
// Blends REAL live weather (Open-Meteo) + REAL solunar math + the user's own
// catch history. The score is a transparent estimate, not a scientific
// prediction: every factor is listed with its impact, and a caveat is shown.
// ============================================================================
import {
  CatchLogItem,
  FishingConditionsReport,
  LiveWeather,
  MoonInfo,
  ReportFactor,
  SolunarPeriod,
  SunTimes,
} from '../types/catchLogTypes';
import { formatTime } from './solunar';
import { parseWeightLbs, speciesOf } from './insights';

/** Per-species general knowledge adjustments (labeled as general knowledge). */
const SPECIES_PREFS: Record<string, { label: string; idealLowLight: boolean; stablePressure: boolean; warmBias: boolean }> = {
  'Largemouth Bass': { label: 'Largemouth Bass', idealLowLight: true, stablePressure: false, warmBias: true },
  'Smallmouth Bass': { label: 'Smallmouth Bass', idealLowLight: true, stablePressure: false, warmBias: true },
  'Northern Pike': { label: 'Northern Pike', idealLowLight: false, stablePressure: false, warmBias: false },
  'Walleye': { label: 'Walleye', idealLowLight: true, stablePressure: true, warmBias: false },
  'Rainbow Trout': { label: 'Rainbow Trout', idealLowLight: true, stablePressure: true, warmBias: false },
  'Brown Trout': { label: 'Brown Trout', idealLowLight: true, stablePressure: true, warmBias: false },
  'Catfish': { label: 'Catfish', idealLowLight: false, stablePressure: false, warmBias: true },
  'Crappie': { label: 'Crappie', idealLowLight: true, stablePressure: true, warmBias: true },
  'Bluegill': { label: 'Bluegill', idealLowLight: true, stablePressure: true, warmBias: true },
  'Yellow Perch': { label: 'Yellow Perch', idealLowLight: true, stablePressure: true, warmBias: false },
  'Salmon': { label: 'Salmon', idealLowLight: false, stablePressure: false, warmBias: false },
  'Red Drum': { label: 'Red Drum', idealLowLight: false, stablePressure: false, warmBias: true },
  'Snook': { label: 'Snook', idealLowLight: true, stablePressure: false, warmBias: true },
  'Tarpon': { label: 'Tarpon', idealLowLight: false, stablePressure: false, warmBias: true },
  'Muskellunge': { label: 'Muskellunge', idealLowLight: true, stablePressure: false, warmBias: false },
};

function isLowLightNow(sun: SunTimes | null, now: Date): boolean {
  if (!sun) return false;
  const before = new Date(sun.sunrise.getTime() - 60 * 60000);
  const after = new Date(sun.sunset.getTime() - 60 * 60000);
  return now >= before && now <= new Date(sun.sunset.getTime() + 60 * 60000);
}

function windowOverlap(p: SolunarPeriod, sun: SunTimes | null, now: Date): { start: Date; end: Date } | null {
  // A solunar period "counts" if it's within ±2h of now (for the "right now" report)
  const twoHours = 2 * 3600000;
  if (Math.abs(p.start.getTime() - now.getTime()) <= twoHours || Math.abs(p.end.getTime() - now.getTime()) <= twoHours) {
    return { start: p.start, end: p.end };
  }
  return null;
}

export function buildFishReport(opts: {
  species: string;
  weather: LiveWeather | null;
  moon: MoonInfo;
  sun: SunTimes | null;
  solunar: SolunarPeriod[];
  catches: CatchLogItem[];
  now?: Date;
}): FishingConditionsReport {
  const { species, weather, moon, sun, solunar, catches } = opts;
  const now = opts.now || new Date();

  const prefs = SPECIES_PREFS[species] || { label: species, idealLowLight: true, stablePressure: false, warmBias: false };
  const factors: ReportFactor[] = [];
  let score = 50; // start neutral

  // --- FACTOR 1: real weather (when available) ---
  if (weather) {
    const t = weather.current.temperatureF;
    const warm = t >= 60 && t <= 80;
    const cold = t < 50;
    const hot = t > 88;
    if (warm) {
      score += 12;
      factors.push({ label: 'Temperature', impact: 'HELPS', detail: `${t}°F is in the comfortable band for ${species}.` });
    } else if (cold) {
      score -= 10;
      factors.push({ label: 'Temperature', impact: 'HURTS', detail: `${t}°F is cold — metabolism slows, bites get subtle.` });
    } else if (hot) {
      score -= 8;
      factors.push({ label: 'Temperature', impact: 'HURTS', detail: `${t}°F pushes fish deep or into shade — target low-light windows.` });
    } else {
      factors.push({ label: 'Temperature', impact: 'NEUTRAL', detail: `${t}°F is workable — adjust depth and speed.` });
    }

    // Pressure trend
    if (weather.pressureTrend === 'STEADY') {
      score += prefs.stablePressure ? 8 : 4;
      factors.push({ label: 'Pressure trend', impact: 'HELPS', detail: `Pressure is steady (${weather.current.pressureInHg} inHg).` });
    } else if (weather.pressureTrend === 'FALLING') {
      score += 6;
      factors.push({ label: 'Pressure trend', impact: 'HELPS', detail: `Pressure falling (−${Math.abs(weather.pressureDelta6h).toFixed(2)} inHg/6h) — classic pre-front feeding trigger.` });
    } else {
      score -= 6;
      factors.push({ label: 'Pressure trend', impact: 'HURTS', detail: `Pressure rising (+${weather.pressureDelta6h.toFixed(2)} inHg/6h) — post-front fish are often sluggish.` });
    }

    // Wind
    const w = weather.current.windSpeedMph;
    if (w >= 5 && w <= 15) {
      score += 6;
      factors.push({ label: 'Wind', impact: 'HELPS', detail: `${w} mph wind breaks up the surface and pushes bait — active feeding.` });
    } else if (w > 15) {
      score -= 5;
      factors.push({ label: 'Wind', impact: 'HURTS', detail: `${w} mph is tough to fish — seek protected banks.` });
    } else {
      factors.push({ label: 'Wind', impact: 'NEUTRAL', detail: `Light wind (${w} mph) — finesse presentations may be needed.` });
    }

    // Precipitation / sky
    if (weather.current.precipitationMm >= 2) {
      score += 4;
      factors.push({ label: 'Sky & rain', impact: 'HELPS', detail: `Light precipitation shades the water — fish roam shallower.` });
    } else if (weather.current.precipitationMm >= 8) {
      score -= 4;
      factors.push({ label: 'Sky & rain', impact: 'HURTS', detail: `Heavy rain — dirty water and tough conditions; slow down.` });
    } else {
      factors.push({ label: 'Sky', impact: 'NEUTRAL', detail: `${weather.current.condition} with ${weather.current.cloudCoverPct}% cloud cover.` });
    }
  } else {
    factors.push({ label: 'Live weather', impact: 'NEUTRAL', detail: 'Live weather unavailable (no location access) — score uses solunar + your history only.', });
  }

  // --- FACTOR 2: solunar (always available) ---
  const activePeriod = solunar.find((p) => windowOverlap(p, sun, now));
  if (activePeriod) {
    const bonus = activePeriod.type === 'MAJOR' ? 12 : 7;
    score += bonus;
    factors.push({
      label: activePeriod.type === 'MAJOR' ? 'Solunar major period' : 'Solunar minor period',
      impact: 'HELPS',
      detail: `Active ${activePeriod.type.toLowerCase()} window now (${formatTime(activePeriod.start)} – ${formatTime(activePeriod.end)}).`,
    });
  } else {
    const next = solunar.find((p) => p.start.getTime() > now.getTime());
    factors.push({
      label: 'Solunar window',
      impact: 'NEUTRAL',
      detail: next
        ? `Next ${next.type.toLowerCase()} period at ${formatTime(next.start)}.`
        : 'No solunar window in the next few hours.',
    });
  }

  // Moon phase
  if (moon.illuminationPct >= 85 || moon.illuminationPct <= 10) {
    score += 4;
    factors.push({ label: 'Moon phase', impact: 'HELPS', detail: `${moon.phaseName} (${moon.illuminationPct}%) — stronger tidal/feeding influence.` });
  } else {
    factors.push({ label: 'Moon phase', impact: 'NEUTRAL', detail: `${moon.phaseName} (${moon.illuminationPct}%).` });
  }

  // Low-light window (dawn/dusk)
  if (sun) {
    if (isLowLightNow(sun, now) && prefs.idealLowLight) {
      score += 6;
      factors.push({ label: 'Low-light window', impact: 'HELPS', detail: `${species} feed aggressively at dawn/dusk — you're in the window.` });
    }
  }

  // --- FACTOR 3: user's own history (the differentiator) ---
  const speciesCatches = catches.filter((c) => speciesOf(c) === species);
  if (speciesCatches.length > 0) {
    const hour = now.getHours();
    const parseHour = (iso: string): number | null => {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      const h = d.getHours();
      return Number.isFinite(h) ? h : null;
    };
    const hourHits = speciesCatches.filter((c) => parseHour(c.timestamp) === hour).length;
    if (hourHits > 0) {
      score += 8;
      factors.push({
        label: 'Personal history',
        impact: 'HELPS',
        fromHistory: true,
        detail: `You've landed ${hourHits} ${species} around this hour (${hourHits}/${speciesCatches.length} of your ${species} catches).`,
      });
    } else {
      const best = [...new Set(speciesCatches.map((c) => parseHour(c.timestamp)).filter((h): h is number => h !== null))].sort((a, b) => a - b);
      factors.push({
        label: 'Personal history',
        impact: 'NEUTRAL',
        fromHistory: true,
        detail: best.length
          ? `Your ${species} catches cluster around ${best.map((h) => `${h % 12 || 12}${h >= 12 ? 'PM' : 'AM'}`).join(', ')} — this hour is off your pattern.`
          : `You have ${species} catches logged, but their timestamps aren't usable for hour patterns yet.`,
      });
    }
    // Weather-based history match
    if (weather) {
      const condKey = weather.current.condition;
      const condHits = speciesCatches.filter((c) => {
        const cc = c.weather?.condition || '';
        return (
          (condKey.includes('Rain') && cc.includes('Rain')) ||
          (condKey.includes('Overcast') && cc.includes('Overcast')) ||
          (condKey.includes('Clear') && (cc.includes('Clear') || cc.includes('Sunny'))) ||
          (condKey.includes('Cloud') && cc.includes('Cloud'))
        );
      }).length;
      if (condHits >= 2) {
        score += 5;
        factors.push({
          label: 'Condition match',
          impact: 'HELPS',
          fromHistory: true,
          detail: `${condHits} of your ${species} catches came in similar ${weather.current.condition} conditions.`,
        });
      }
    }
  } else {
    factors.push({
      label: 'Personal history',
      impact: 'NEUTRAL',
      fromHistory: true,
      detail: `No ${species} catches logged yet — log a few and the score will personalize.`,
    });
  }

  // Clamp + grade
  score = Math.max(5, Math.min(97, Math.round(score)));
  const grade = score >= 75 ? 'EXCELLENT' : score >= 58 ? 'GOOD' : score >= 40 ? 'FAIR' : 'POOR';

  // Best window: next major/minor period or dawn/dusk
  let bestWindow: FishingConditionsReport['bestWindow'] = null;
  const upcoming = solunar.find((p) => p.end.getTime() > now.getTime());
  if (upcoming) {
    bestWindow = { start: formatTime(upcoming.start), end: formatTime(upcoming.end) };
  } else if (sun && sun.sunrise.getTime() > now.getTime()) {
    bestWindow = { start: formatTime(sun.sunrise), end: formatTime(new Date(sun.sunrise.getTime() + 90 * 60000)) };
  }

  const weatherNote = weather ? 'live weather' : 'solunar + history only';
  const summary =
    score >= 75
      ? `Strong conditions for ${species} right now — good time to be on the water.`
      : score >= 58
      ? `Decent conditions for ${species} — pick your window and match the presentation.`
      : score >= 40
      ? `Average conditions — slow presentations or target the best window below.`
      : `Tough conditions — consider a different time or species.`;

  return {
    targetSpecies: species,
    score,
    grade,
    summary,
    bestWindow,
    factors,
    confidence: weather ? 'HIGH' : 'MEDIUM',
    caveat: `Score based on ${weatherNote} plus general fishing knowledge and your logged history (${speciesCatches.length} ${species} catch${speciesCatches.length === 1 ? '' : 'es'}). It's a planning aid, not a guarantee.`,
  };
}

/** Suggest a report species based on the user's most-caught species. */
export function suggestTargetSpecies(catches: CatchLogItem[]): string {
  if (catches.length === 0) return 'Largemouth Bass';
  const counts = new Map<string, number>();
  for (const c of catches) {
    const s = speciesOf(c);
    counts.set(s, (counts.get(s) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** Weighted lure recommendation: personal success first, then weather fit. */
export function recommendLures(catches: CatchLogItem[], species: string, weather: LiveWeather | null, limit = 3): { name: string; reason: string; catches: number }[] {
  const sc = catches.filter((c) => speciesOf(c) === species);
  const counts = new Map<string, number>();
  for (const c of sc) {
    if (!c.baitUsed || c.baitUsed === 'Unspecified Bait') continue;
    counts.set(c.baitUsed, (counts.get(c.baitUsed) || 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const out: { name: string; reason: string; catches: number }[] = [];
  for (const [name, n] of ranked) {
    if (out.length >= limit) break;
    out.push({ name, reason: `Your top ${species} producer — ${n} catch${n === 1 ? '' : 'es'}.`, catches: n });
  }
  // General-knowledge fillers when history is thin (clearly labeled)
  if (weather && out.length < limit) {
    const w = weather.current.windSpeedMph;
    if (w >= 10) {
      out.push({ name: 'Spinnerbait / chatterbait', reason: 'Windy — vibration and flash help fish find it. (general knowledge)', catches: 0 });
    } else if (weather.current.precipitationMm >= 1) {
      out.push({ name: 'Shallow crankbait', reason: 'Overcast/rain — fish roam shallower. (general knowledge)', catches: 0 });
    } else {
      out.push({ name: 'Soft plastic (Senko/jig)', reason: 'Calm, bright conditions — slow finesse presentation. (general knowledge)', catches: 0 });
    }
  }
  return out.slice(0, limit);
}

/** Weighted bait average helper (re-exported for assistant use). */
export function avgWeightOf(catches: CatchLogItem[], species: string): number | null {
  const ws = catches.filter((c) => speciesOf(c) === species).map((c) => parseWeightLbs(c.estimatedWeight)).filter((w): w is number => w !== null);
  return ws.length ? Math.round((ws.reduce((a, b) => a + b, 0) / ws.length) * 10) / 10 : null;
}
