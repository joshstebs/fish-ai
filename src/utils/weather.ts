// ============================================================================
// REAL WEATHER VIA OPEN-METEO (free, no API key required)
// https://open-meteo.com/en/docs
// ============================================================================
import { LiveWeather } from '../types/catchLogTypes';

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

/** Get the browser's geolocation. Resolves null when denied/unavailable. */
export function getUserLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
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
    '&current=temperature_2m,relative_humidity_2m,is_day,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover' +
    '&hourly=temperature_2m,weather_code,surface_pressure,wind_speed_10m,precipitation,cloud_cover' +
    '&past_hours=6&forecast_hours=36' +
    '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=mm';

  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data?.current) return null;

    const now = new Date();
    const cur = data.current;
    const hours = data.hourly;

    // Build hourly snapshots (current hour onward)
    const hourly = (hours.time as string[]).map((t, i) => ({
      time: new Date(t).toISOString(),
      temperatureF: Math.round(hours.temperature_2m[i]),
      windSpeedMph: Math.round(hours.wind_speed_10m[i]),
      pressureInHg: hpaToInHg(hours.surface_pressure[i]),
      precipitationMm: hours.precipitation[i],
      cloudCoverPct: hours.cloud_cover[i],
      condition: weatherCodeToCondition(hours.weather_code[i]),
    }));

    // Pressure trend over the past 6 hours (from past_hours data)
    const nowIdx = hours.time.findIndex((t: string) => new Date(t).getTime() >= now.getTime());
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

/** Try location, falling back to the first saved fishing spot's coordinates. */
export async function resolveWeatherCoords(spots: { latitude?: number; longitude?: number }[]): Promise<{ latitude: number; longitude: number } | null> {
  const loc = await getUserLocation();
  if (loc) return loc;
  const spot = spots.find((s) => s.latitude && s.longitude);
  if (spot && spot.latitude && spot.longitude) return { latitude: spot.latitude, longitude: spot.longitude };
  return null;
}
