// ============================================================================
// Real place search + reverse geocoding via OpenStreetMap Nominatim.
// Free, no API key. Returns REAL coordinates — never fabricated places.
// The Lovable variant used Google Places through Lovable's own connector
// gateway; that infra doesn't exist in this SPA, so we use the key-free
// OSM Nominatim endpoint directly (same pattern as ipapi/open-meteo calls).
// Usage note: the browser sends its normal Referer/User-Agent to Nominatim.
// ============================================================================

export type PlaceResult = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

const SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const MIN_REQUEST_INTERVAL_MS = 1100;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let nextRequestAt = 0;
const responseCache = new Map<string, { expiresAt: number; value: null | Record<string, unknown> | Record<string, unknown>[] }>();

async function nomJson(url: string): Promise<null | Record<string, unknown> | Record<string, unknown>[]> {
  const cached = responseCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const waitMs = Math.max(0, nextRequestAt - Date.now());
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  nextRequestAt = Date.now() + MIN_REQUEST_INTERVAL_MS;

  try {
    const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!resp.ok) return null;
    const value = await resp.json() as null | Record<string, unknown> | Record<string, unknown>[];
    responseCache.set(url, { expiresAt: Date.now() + CACHE_TTL_MS, value });
    return value;
  } catch {
    return null;
  }
}

function shortLabel(displayName: string): string {
  return displayName.split(',')[0]?.trim() || displayName;
}

/** Search for a lake, river, town, or near-a-town place by name. */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (query.trim().length < 2) return [];
  const q = encodeURIComponent(query.trim());
  const data = await nomJson(`${SEARCH_URL}?format=jsonv2&limit=8&accept-language=en&q=${q}`);
  const list = Array.isArray(data) ? data : [];

  return list
    .filter((r) => typeof r.lat === 'string' && typeof r.lon === 'string')
    .map((r) => {
      const display = typeof r.display_name === 'string' ? r.display_name : '';
      const parts = display.split(',');
      const name = (typeof r.name === 'string' && r.name) || parts[0]?.trim() || 'Unnamed spot';
      const address = parts.slice(1).join(',').trim() || display;
      return {
        id: String(r.place_id ?? `${Number(r.lat)}|${Number(r.lon)}`),
        name,
        address,
        latitude: Number(r.lat),
        longitude: Number(r.lon),
      };
    });
}

/** Human-readable label for the current GPS position. */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  const data = await nomJson(
    `${REVERSE_URL}?format=jsonv2&accept-language=en&lat=${latitude}&lon=${longitude}`,
  );
  if (!data || Array.isArray(data)) return 'Current position';
  const addr = (data.address ?? {}) as Record<string, unknown>;
  const first = [
    addr.natural,
    addr.water,
    addr.reservoir,
    addr.lake,
    addr.river,
    addr.city,
    addr.town,
    addr.village,
    addr.state,
    addr.country,
  ].find((v): v is string => typeof v === 'string' && v.length > 0);
  return first ?? (typeof data.display_name === 'string' ? shortLabel(data.display_name) : 'Current position');
}
