// ============================================================================
// REAL WEATHER VIA OPEN-METEO (free, no API key required)
// https://open-meteo.com/en/docs
// ============================================================================
import { LiveWeather } from '../types/catchLogTypes';
import { loadProfile } from './profile';

const WEATHER_CACHE_KEY = 'fish_ai_weather_cache';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear Sky',
  1: 'Mostly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Icy Fog',
  51: 'Light Drizzle',
  53: 'Drizzle',
  55: 'Heavy Drizzle',
  61: 'Light Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  66: 'Freezing Rain',
  67: 'Heavy Freezing Rain',
  71: 'Light Snow',
  73: 'Snow',
  75: 'Heavy Snow',
  77: 'Snow Grains',
  80: 'Light Showers',
  81: 'Showers',
  82: 'Heavy Showers',
  85: 'Snow Showers',
  86: 'Heavy Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm + Hail',
  99: 'Severe Thunderstorm + Hail',
};

export function weatherCodeToCondition(code: number): string {
  return WEATHER_CODES[code] || 'Unknown';
}

export function degreesToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function hpaToInHg(hpa: number): number {
  return Math.round(hpa * 0.0295299830714 * 100) / 100;
}

export type LocationResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: 'unsupported' | 'denied' | 'unavailable' | 'timeout' };

/**
 * Get the browser's geolocation. On failure returns a reason so the UI can show
 * the right recovery path (e.g. a "tap to enable location" affordance) instead of
 * silently dropping to the fallback. A retry re-opens the browser permission prompt
 * even when a prior denial was cached as "dismissed".
 */
export function getUserLocation(opts?: { retry?: boolean }): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve({ ok: false, reason: 'unsupported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ ok: true, latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => {
        // err.code 1 = PERMISSION_DENIED. A retry resets browserUIState so the
        // permission prompt re-appears (denial was previously cached as dismissed).
        if (err.code === 1 && opts?.retry) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ ok: true, latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (e2) => resolve({ ok: false, reason: e2.code === 1 ? 'denied' : e2.code === 3 ? 'timeout' : 'unavailable' }),
            { timeout: 8000, maximumAge: 0 }
          );
          return;
        }
        resolve({
          ok: false,
          reason: err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable',
        });
      },
      { timeout: 8000, maximumAge: 10 * 60 * 1000, ...(opts?.retry ? { maximumAge: 0 } : {}) }
    );
  });
}

export function roundCoord(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export async function fetchLiveWeather(lat: number, lon: number): Promise<LiveWeather | null> {
  const cacheKey = `${WEATHER_CACHE_KEY}_${roundCoord(lat, lon)}`;

  // Serve from cache when fresh
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as LiveWeather;
      if (Date.now() - new Date(parsed.fetchedAt).getTime() < CACHE_TTL_MS) {
        return parsed;
      }
    }
  } catch {
    /* ignore cache errors */
  }

  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    '&current=temperature_2m,relative_humidity_2m,is_day,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover,dew_point_2m,visibility' +
    '&hourly=temperature_2m,weather_code,surface_pressure,wind_speed_10m,precipitation,cloud_cover' +
    '&past_hours=6&forecast_hours=36' +
    '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=mm' +
    '&timezone=auto';

  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data?.current) return null;

    const now = new Date();
    const cur = data.current;
    const hours = data.hourly;

    // Open-Meteo (timezone=auto) returns naive local-to-the-spot time strings.
    // Convert each to a real UTC instant using the spot's utc_offset_seconds so
    // labels/scores stay correct no matter what timezone the browser is in.
    const utcOffsetSec: number = data.utc_offset_seconds ?? 0;
    const spotTimeToUtc = (t: string): Date => {
      // 'YYYY-MM-DDTHH:mm' -> treat as spot-wall-clock, subtract offset to get UTC
      const asUtc = new Date(`${t}:00Z`); // parse naive string as if it were UTC
      return new Date(asUtc.getTime() - utcOffsetSec * 1000);
    };

    // Build hourly snapshots (current hour onward)
    const hourly = (hours.time as string[]).map((t, i) => ({
      time: spotTimeToUtc(t).toISOString(),
      temperatureF: Math.round(hours.temperature_2m[i]),
      windSpeedMph: Math.round(hours.wind_speed_10m[i]),
      pressureInHg: hpaToInHg(hours.surface_pressure[i]),
      precipitationMm: hours.precipitation[i],
      cloudCoverPct: hours.cloud_cover[i],
      condition: weatherCodeToCondition(hours.weather_code[i]),
    }));

    // Pressure trend over the past 6 hours (from past_hours data)
    const nowIdx = hours.time.findIndex((t: string) => spotTimeToUtc(t).getTime() >= now.getTime());
    const idx = nowIdx >= 0 ? nowIdx : hours.time.length - 1;
    const p6 = hours.surface_pressure.slice(Math.max(0, idx - 6), idx + 1) as number[];
    const pStart = p6[0];
    const pEnd = p6[p6.length - 1];
    const pressureDelta6h = hpaToInHg(pEnd - pStart);
    const pressureTrend: LiveWeather['pressureTrend'] =
      pressureDelta6h > 0.05 ? 'RISING' : pressureDelta6h < -0.05 ? 'FALLING' : 'STEADY';

    const live: LiveWeather = {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone || 'auto',
      fetchedAt: new Date().toISOString(),
      current: {
        temperatureF: Math.round(cur.temperature_2m),
        windSpeedMph: Math.round(cur.wind_speed_10m),
        windDirectionDeg: cur.wind_direction_10m,
        windDirection: degreesToCompass(cur.wind_direction_10m),
        pressureInHg: hpaToInHg(cur.surface_pressure),
        precipitationMm: cur.precipitation,
        cloudCoverPct: cur.cloud_cover,
        weatherCode: cur.weather_code,
        condition: weatherCodeToCondition(cur.weather_code),
        isDay: cur.is_day === 1,
        relativeHumidityPct: cur.relative_humidity_2m ?? undefined,
        dewPointF: cur.dew_point_2m ?? undefined,
        visibilityMi: cur.visibility != null ? Math.round(cur.visibility * 0.000621371) : undefined,
      },
      hourly,
      pressureTrend,
      pressureDelta6h,
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(live));
    } catch {
      /* storage may be full — ignore */
    }
    return live;
  } catch (e) {
    console.error('Weather fetch failed:', e);
    return null;
  }
}

/** Choose coordinates for live weather: the angler's saved home water first,
 *  then browser geolocation, then the first saved spot with coordinates.
 *  Preferring home water means the report/solunar/pressure views all anchor
 *  to the exact water the angler set in onboarding. */
export async function resolveWeatherCoords(spots: { latitude?: number; longitude?: number }[]): Promise<{ latitude: number; longitude: number } | null> {
  const home = loadProfile().location;
  if (home?.latitude != null && home?.longitude != null) return { latitude: home.latitude, longitude: home.longitude };
  const loc = await getUserLocation();
  if (loc.ok) return loc;
  const spot = spots.find((s) => s.latitude && s.longitude);
  if (spot && spot.latitude && spot.longitude) return { latitude: spot.latitude, longitude: spot.longitude };
  return null;
}
