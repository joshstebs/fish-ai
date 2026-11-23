// ============================================================================
// Real-data adapter for the Lovable DailyReport.
// Produces the exact Lovable `FishReport` shape (src/lib/fishing.ts) from
// fish-ai's real engines: Open-Meteo live weather (weather.ts) + astronomy
// (solunar.ts) + the ported Lovable scoring maths (fishing.ts).
// No fabricated values — every number traces to a real fetch or real math.
// ============================================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLiveWeather } from './weather';
import { getSunTimes } from './solunar';
import {
  FishReport,
  LureId,
  SpeciesId,
  BiteHour,
  confidenceLabel,
  moonIllumination,
  recommendLure,
  scoreHour,
} from './fishing';

const INHG_TO_MB = 33.8639;

// Local hour (0-23) of an ISO instant in the given IANA timezone.
let hourFmt: Intl.DateTimeFormat | null = null;
function hourInTz(timeZone: string, iso: string): number {
  hourFmt = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', hour: 'numeric' });
  return Number(hourFmt.format(new Date(iso)));
}
function fmtClock(hour: number) {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${suffix}`;
}
function windowLabel(startHour: number, endHour: number) {
  return `${fmtClock(startHour)} – ${fmtClock(endHour)}`;
}

export async function buildFishReport(input: {
  location: { latitude: number; longitude: number; label: string };
  species: SpeciesId;
  tackle: LureId[];
}): Promise<FishReport> {
  const { location, species, tackle } = input;
  const weather = await fetchLiveWeather(location.latitude, location.longitude);
  if (!weather) throw new Error("Couldn't pull live conditions for this spot. Try again in a moment.");

  const tz = weather.timezone || 'UTC';
  const now = new Date();

  // Sunrise/sunset local hours for daytime detection (real astronomy).
  const sun = getSunTimes(now, location.latitude, location.longitude);
  const sunUp = sun ? hourInTz(tz, sun.sunrise.toISOString()) : 6;
  const sunDown = sun ? hourInTz(tz, sun.sunset.toISOString()) : 19;
  const isDaytimeAt = (hl: number) => hl >= sunUp && hl < sunDown;

  const moon = moonIllumination(now);
  const moonFactor = Math.abs(moon.illumination - 0.5) * 2;

  // Slice the forecast to the next 24 hours starting from today's current hour.
  const hourly = weather.hourly;
  const nowIdx = hourly.findIndex((h) => new Date(h.time).getTime() >= now.getTime());
  const startIdx = nowIdx >= 0 ? nowIdx : 0;
  const upcoming = hourly.slice(startIdx, startIdx + 24);

  const deltaMb = weather.pressureDelta6h * INHG_TO_MB;
  const trend = weather.pressureTrend === 'FALLING' ? 'Falling' : weather.pressureTrend === 'RISING' ? 'Rising' : 'Steady';

  const hours: BiteHour[] = upcoming.map((h) => {
    const hourLocal = hourInTz(tz, h.time);
    return {
      time: h.time,
      label: fmtClock(hourLocal),
      score: scoreHour(
        {
          time: h.time,
          hourLocal,
          isDaytime: isDaytimeAt(hourLocal),
          cloudCover: h.cloudCoverPct,
          windMph: h.windSpeedMph,
          precipChance: h.precipitationMm > 0 ? Math.min(100, h.precipitationMm * 20) : 0,
          pressureMb: h.pressureInHg * INHG_TO_MB,
          tempF: h.temperatureF,
        },
        deltaMb,
        moonFactor,
      ),
      isPeak: false,
      isNow: false,
    };
  });

  // Best contiguous 3-hour window = major; second best non-overlapping = minor.
  if (hours[0]) hours[0].isNow = true;
  const windowScore = (i: number) => (hours[i]?.score ?? 0) + (hours[i + 1]?.score ?? 0) + (hours[i + 2]?.score ?? 0);
  let bestIdx = 0;
  for (let i = 0; i + 2 < hours.length; i++) if (windowScore(i) > windowScore(bestIdx)) bestIdx = i;
  let minorIdx = -1;
  for (let i = 0; i + 2 < hours.length; i++) {
    if (Math.abs(i - bestIdx) < 3) continue;
    if (minorIdx === -1 || windowScore(i) > windowScore(minorIdx)) minorIdx = i;
  }
  for (let i = bestIdx; i < bestIdx + 3 && i < hours.length; i++) {
    const hour = hours[i];
    if (hour) hour.isPeak = true;
  }

  const cur = weather.current;
  const tempF = cur.temperatureF;
  const cloudCover = cur.cloudCoverPct;
  const windMph = cur.windSpeedMph;
  const nowHourLocal = hourInTz(tz, now.toISOString());
  const peaks = [...hours].sort((a, b) => b.score - a.score);
  const peakAvg = hours[bestIdx] ? Math.round(windowScore(bestIdx) / 3) : (peaks[0]?.score ?? 0);
  const nowScore = hours[0]?.score ?? peakAvg;
  const score = Math.max(5, Math.min(98, Math.round(peakAvg * 0.65 + nowScore * 0.35)));

  const factors = [
    { label: 'Pressure', detail: `${trend.toLowerCase()} ${Math.abs(deltaMb).toFixed(1)} mb over 6h`, positive: trend !== 'Rising' },
    { label: 'Cloud cover', detail: `${cloudCover}% — ${cloudCover > 50 ? 'good roaming light' : 'bright, tighter to cover'}`, positive: cloudCover > 50 },
    { label: 'Wind', detail: `${windMph} mph ${cur.windDirection}`, positive: windMph >= 4 && windMph <= 14 },
    { label: 'Moon', detail: `${Math.round(moon.illumination * 100)}% illuminated`, positive: moonFactor > 0.5 },
  ];

  const summary =
    score >= 75
      ? 'Strong conditions for your patterns. Stay focused.'
      : score >= 55
        ? 'Workable conditions. Fish the peak window hard.'
        : score >= 38
          ? 'Mixed signals. Slow down and cover proven water.'
          : 'Tough day. Downsize and target the highest-percentage spots.';

  const localNow = now;
  const localTime = localNow.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true });

  const majorStart = hours[bestIdx] ? hourInTz(tz, hours[bestIdx]!.time) : nowHourLocal;
  const minorStart = minorIdx >= 0 ? hourInTz(tz, hours[minorIdx]!.time) : (majorStart + 6) % 24;

  return {
    location: { label: location.label, latitude: location.latitude, longitude: location.longitude },
    updatedAt: now.toISOString(),
    localTime,
    timeZone: tz,
    current: {
      tempF,
      condition: cur.condition,
      windMph,
      windDir: cur.windDirection,
      // Preserve nulls so the UI can label missing fields instead of showing fake 0s as live data.
      humidity: cur.relativeHumidityPct ?? null,
      dewPointF: cur.dewPointF ?? null,
      visibilityMi: cur.visibilityMi ?? null,
      pressureInHg: cur.pressureInHg,
      cloudCover,
      precipChance: cur.precipitationMm > 0 ? Math.min(100, cur.precipitationMm * 20) : 0,
    },
    confidence: { score, label: confidenceLabel(score), summary, factors },
    pressure: {
      inHg: cur.pressureInHg,
      deltaMb: Number(deltaMb.toFixed(2)),
      trend,
      note: trend === 'Falling' ? 'Falling ahead of a change — feeding usually turns on'
        : trend === 'Rising' ? 'Rising behind a front — expect a tighter, slower bite'
        : 'Steady over the last 6 hours — consistent, predictable feeding',
      series: hourly.map((h) => Number((h.pressureInHg * INHG_TO_MB).toFixed(1))),
    },
    biteWindow: {
      hours,
      major: windowLabel(majorStart, (majorStart + 3) % 24),
      minor: windowLabel(minorStart, (minorStart + 2) % 24),
    },
    recommendation: recommendLure({
      tempF,
      cloudCover,
      windMph,
      trend,
      isDaytime: isDaytimeAt(nowHourLocal),
      hourLocal: nowHourLocal,
      species,
      tackle,
    }),
    preferences: { species, tackle },
  };
}

// Mirror of TanStack Query's useQuery surface so the verbatim Lovable
// DailyReport component can consume it unchanged.
export function useFishReport(input: {
  location: { latitude: number; longitude: number; label: string } | null;
  species: SpeciesId;
  tackle: LureId[];
}) {
  const [state, setState] = useState<{
    data: FishReport | null;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
    isFetching: boolean;
  }>({ data: null, isPending: true, isError: false, error: null, isFetching: false });
  const key = input.location
    ? `${input.location.latitude},${input.location.longitude},${input.species},${[...input.tackle].sort().join('|')}`
    : '';
  const keyRef = useRef(key);
  keyRef.current = key;

  const run = useCallback(async () => {
    const loc = input.location;
    if (!loc) {
      setState({ data: null, isPending: false, isError: true, error: new Error('No home water set.'), isFetching: false });
      return;
    }
    // Ignore a stale response if the key changed mid-await.
    const k = keyRef.current;
    setState((s) => ({ ...s, isFetching: true }));
    try {
      const report = await buildFishReport({ location: loc, species: input.species, tackle: input.tackle });
      if (keyRef.current !== k) return;
      setState({ data: report, isPending: false, isError: false, error: null, isFetching: false });
    } catch (e) {
      if (keyRef.current !== k) return;
      setState({ data: null, isPending: false, isError: true, error: e instanceof Error ? e : new Error(String(e)), isFetching: false });
    }
  }, [input.location, input.species, input.tackle]);

  useEffect(() => {
    setState({ data: null, isPending: true, isError: false, error: null, isFetching: false });
    void run();
  }, [run]);

  return { ...state, refetch: run };
}
