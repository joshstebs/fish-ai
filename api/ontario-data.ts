/**
 * Read-only Ontario Open Data lookups.
 * Metadata: https://data.ontario.ca/dataset/fishing-access-points
 *           https://data.ontario.ca/dataset/named-geographic-features
 * Licence: https://www.ontario.ca/page/open-government-licence-ontario
 * Does not scrape the Fish ON-Line viewer or represent legal fishing advice.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildLakeNameWhere } from '../server/utils/ontarioLakeSearch.js';

const ORIGIN = 'https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA';
const SOURCE = {
  access: ORIGIN + '/LIO_Open07/MapServer/15/query',
  lakes: ORIGIN + '/LIO_Open09/MapServer/36/query',
};
const cache = 'public, s-maxage=3600, stale-while-revalidate=7200';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', status === 200 ? cache : 'no-store');
  res.end(JSON.stringify(body));
}
function finite(v: string | null, min: number, max: number): number | null {
  if (v == null || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return send(res, 405, { error: 'Method not allowed' }); }
  const p = new URL(req.url || '/', 'https://fishai.shop').searchParams;
  const mode = p.get('mode');
  if (mode !== 'access' && mode !== 'lakes') return send(res, 400, { error: 'Choose mode access or lakes' });
  const q = new URLSearchParams({ f: 'json', returnGeometry: 'true', outSR: '4326', resultRecordCount: '40' });
  if (mode === 'access') {
    const lat = finite(p.get('lat'), 41, 57);
    const lon = finite(p.get('lon'), -96, -74);
    const radius = finite(p.get('radiusKm') || '25', 1, 50);
    if (lat === null || lon === null || radius === null) return send(res, 400, { error: 'Provide valid Ontario coordinates and radius (1 to 50 km)' });
    q.set('where', '1=1');
    q.set('geometry', JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }));
    q.set('geometryType', 'esriGeometryPoint');
    q.set('inSR', '4326');
    q.set('distance', String(radius * 1000));
    q.set('units', 'esriSRUnit_Meter');
    q.set('spatialRel', 'esriSpatialRelIntersects');
    q.set('outFields', 'SITE_NAME,FISHING_ACCESS_POINT_TYPE,SITE_LAST_VERIFICATION_DATE,PARKING_PRESENCE_FLG,USER_FEE_FLG');
  } else {
    const name = (p.get('q') || '').trim();
    const where = buildLakeNameWhere(name);
    if (!where) return send(res, 400, { error: 'Enter 2 to 50 letters/numbers for a lake-name search' });
    q.set('where', where);
    q.set('outFields', 'OFFICIAL_NAME,ENTITY_TYPE,LATITUDE_DECIMAL_DEGREES,LONGITUDE_DECIMAL_DEGREES,GEONAME_STATUS');
    q.set('returnGeometry', 'false');
    q.set('orderByFields', 'OFFICIAL_NAME ASC');
  }
  try {
    const upstream = await fetch(SOURCE[mode] + '?' + q.toString(), { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    if (!upstream.ok) return send(res, 503, { error: 'Ontario open data service unavailable', status: upstream.status });
    const data = await upstream.json() as { error?: unknown; features?: Array<{ attributes?: Record<string, unknown>; geometry?: { x?: number; y?: number } }> };
    if (data.error || !Array.isArray(data.features)) return send(res, 503, { error: 'Ontario open data service returned an error' });
    const items = data.features.map(f => {
      const a = f.attributes || {};
      return mode === 'access' ? {
        name: String(a.SITE_NAME || 'Unnamed access point'),
        kind: String(a.FISHING_ACCESS_POINT_TYPE || 'Access point'),
        lat: f.geometry?.y ?? null, lon: f.geometry?.x ?? null,
        lastVerified: typeof a.SITE_LAST_VERIFICATION_DATE === 'number' ? new Date(a.SITE_LAST_VERIFICATION_DATE).toISOString().slice(0, 10) : null,
        parking: a.PARKING_PRESENCE_FLG ?? null, fee: a.USER_FEE_FLG ?? null
      } : {
        name: String(a.OFFICIAL_NAME || ''),
        kind: String(a.ENTITY_TYPE || 'Geographic feature'),
        lat: typeof a.LATITUDE_DECIMAL_DEGREES === 'number' ? a.LATITUDE_DECIMAL_DEGREES : null,
        lon: typeof a.LONGITUDE_DECIMAL_DEGREES === 'number' ? a.LONGITUDE_DECIMAL_DEGREES : null,
        status: a.GEONAME_STATUS ?? null
      };
    }).filter(x => mode === 'access' || /lake|waterbody|reservoir/i.test(x.kind));
    return send(res, 200, { source: mode === 'access' ? 'Ontario Fishing Access Points (LIO)' : 'Ontario Geographic Names (LIO)', licence: 'Open Government Licence - Ontario', retrievedAt: new Date().toISOString(), items, truncated: data.features.length === 40, disclaimer: 'Catalogue data is informational and may be incomplete or stale; verify legal access and current regulations with Ontario.' });
  } catch {
    return send(res, 503, { error: 'Ontario open data service unavailable; try again later' });
  }
}
