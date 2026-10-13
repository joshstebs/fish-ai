import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchMapData, escapeHtml, accessLabel } from './mapData';

const originalFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = originalFetch; });
test('official access name is displayed safely', () => assert.equal(accessLabel({ SITE_NAME: '<Pier>', NAME: 'wrong' }), '&lt;Pier&gt;'));
test('popup content escapes injected HTML and quotes', () => assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
test('valid GeoJSON is retained', async () => { globalThis.fetch = async () => new Response(JSON.stringify({ features: [] })); assert.deepEqual(await fetchMapData('https://example.test', new AbortController().signal), { features: [] }); });
test('HTTP errors reject', async () => { globalThis.fetch = async () => new Response('', { status: 503 }); await assert.rejects(fetchMapData('https://example.test', new AbortController().signal)); });
test('ArcGIS HTTP 200 errors reject', async () => { globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: 400 } })); await assert.rejects(fetchMapData('https://example.test', new AbortController().signal)); });
test('malformed payload rejects', async () => { globalThis.fetch = async () => new Response(JSON.stringify({ features: null })); await assert.rejects(fetchMapData('https://example.test', new AbortController().signal)); });
test('timeout aborts upstream work', async () => { let aborted = false; globalThis.fetch = async (_, options) => new Promise((_, reject) => { options?.signal?.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')); }); }); await assert.rejects(fetchMapData('https://example.test', new AbortController().signal, 5)); assert.equal(aborted, true); });
test('parent cancellation aborts upstream work', async () => { let aborted = false; globalThis.fetch = async (_, options) => new Promise((_, reject) => { options?.signal?.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')); }); }); const parent = new AbortController(); const pending = fetchMapData('https://example.test', parent.signal); parent.abort(); await assert.rejects(pending); assert.equal(aborted, true); });
