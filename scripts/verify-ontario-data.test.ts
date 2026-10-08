import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { IncomingMessage, ServerResponse } from 'node:http';
import handler from '../api/ontario-data.ts';

async function request(url: string, method = 'GET') {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    setHeader(k: string, v: string) { headers[k.toLowerCase()] = v; },
    end(body: string) { this.body = JSON.parse(body); },
    body: null as unknown
  };
  await handler({ method, url } as IncomingMessage, res as unknown as ServerResponse);
  return { status: res.statusCode, body: res.body as any, headers };
}

test('Ontario data endpoint validates inputs and method', async () => {
  const badMethod = await request('/api/ontario-data?mode=lakes&q=Muskoka', 'POST');
  assert.equal(badMethod.status, 405);
  assert.equal((await request('/api/ontario-data?mode=other')).status, 400);
  assert.equal((await request('/api/ontario-data?mode=lakes&q=a')).status, 400);
  assert.equal((await request('/api/ontario-data?mode=lakes&q=%22%3Bdrop')).status, 400);
  assert.equal((await request('/api/ontario-data?mode=access&lat=999&lon=-83')).status, 400);
  assert.equal((await request('/api/ontario-data?mode=access&lat=42.1&lon=-83.1&radiusKm=999')).status, 400);
});

test('Ontario lake queries preserve source and official coordinate fields', async () => {
  const original = globalThis.fetch;
  let called = '';
  globalThis.fetch = (async (url: string | URL | Request) => {
    called = String(url);
    return new Response(JSON.stringify({ features: [{ attributes: {
      OFFICIAL_NAME: 'Example Lake', ENTITY_TYPE: 'Lake',
      LATITUDE_DECIMAL_DEGREES: 44.1, LONGITUDE_DECIMAL_DEGREES: -79.3,
      GEONAME_STATUS: 'Official'
    }}] }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  try {
    const r = await request('/api/ontario-data?mode=lakes&q=Example');
    assert.equal(r.status, 200);
    assert.equal(r.body.items.length, 1);
    assert.equal(r.body.items[0].name, 'Example Lake');
    assert.equal(r.body.items[0].lon, -79.3);
    assert.match(r.body.licence, /Open Government Licence/);
    assert.match(called, /LIO_Open09/);
    assert.match(decodeURIComponent(called), /ENTITY_TYPE LIKE/);
  } finally { globalThis.fetch = original; }
});

test('Ontario access query requests a bounded radius and returns verification date', async () => {
  const original = globalThis.fetch;
  let called = '';
  globalThis.fetch = (async (url: string | URL | Request) => {
    called = String(url);
    return new Response(JSON.stringify({ features: [{ geometry: {x: -83.11, y: 42.1}, attributes: {
      SITE_NAME: 'Example public-data point', FISHING_ACCESS_POINT_TYPE: 'Shoreline',
      SITE_LAST_VERIFICATION_DATE: Date.UTC(2020, 0, 2)
    } }] }), {status: 200});
  }) as typeof fetch;
  try {
    const r = await request('/api/ontario-data?mode=access&lat=42.1&lon=-83.11&radiusKm=25');
    assert.equal(r.status, 200);
    assert.equal(r.body.items[0].lastVerified, '2020-01-02');
    assert.equal(r.body.items[0].lat, 42.1);
    assert.match(called, /LIO_Open07/);
    assert.equal(new URL(called).searchParams.get('distance'), '25000');
  } finally { globalThis.fetch = original; }
});

test('Ontario upstream errors are not presented as empty search results', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response('Service unavailable', {status: 503})) as typeof fetch;
  try {
    const r = await request('/api/ontario-data?mode=lakes&q=Muskoka');
    assert.equal(r.status, 503);
    assert.equal(r.body.error, 'Ontario open data service unavailable');
  } finally { globalThis.fetch = original; }
});
