import assert from 'node:assert/strict';
import test from 'node:test';
import { csvCell, loadStoredArray } from './storage.js';
import { analyzeCatches } from './insights.js';
import {
  catchMatchesFilters,
  confidenceBand,
  confidenceBandLabel,
  normalizeTackleQuantity,
  parsePositiveMeasurement,
} from './catchLogHelpers.js';
import { buildLakeNameWhere, tokenizeLakeQuery } from '../../server/utils/ontarioLakeSearch.js';
import type { CatchLogItem } from '../types/catchLogTypes.js';

// ---------------------------------------------------------------------------
// 1. localStorage loading rejects non-array JSON
// ---------------------------------------------------------------------------
test('loadStoredArray returns [] for object JSON', () => {
  const store: Record<string, string> = { k: '{"not":"array"}' };
  const original = globalThis.localStorage;
  const stub = {
    getItem: (key: string) => store[key] ?? null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  } as Storage;
  globalThis.localStorage = stub;
  try {
    assert.deepEqual(loadStoredArray('k'), []);
  } finally {
    globalThis.localStorage = original;
  }
});

test('loadStoredArray returns [] for malformed JSON', () => {
  const store: Record<string, string> = { k: '{broken' };
  const original = globalThis.localStorage;
  const stub = {
    getItem: (key: string) => store[key] ?? null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  } as Storage;
  globalThis.localStorage = stub;
  try {
    assert.deepEqual(loadStoredArray('k'), []);
  } finally {
    globalThis.localStorage = original;
  }
});

test('loadStoredArray keeps real arrays', () => {
  const store: Record<string, string> = { k: '[{"id":"1"}]' };
  const original = globalThis.localStorage;
  const stub = {
    getItem: (key: string) => store[key] ?? null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  } as Storage;
  globalThis.localStorage = stub;
  try {
    assert.deepEqual(loadStoredArray('k'), [{ id: '1' }]);
  } finally {
    globalThis.localStorage = original;
  }
});

// ---------------------------------------------------------------------------
// 2. CSV formula injection
// ---------------------------------------------------------------------------
test('csvCell prefixes formula-like values', () => {
  assert.equal(csvCell('=HYPERLINK("http://x")'), `"'=HYPERLINK(""http://x"")"`);
  assert.equal(csvCell('+1234'), `\"'+1234\"`);
  assert.equal(csvCell('-SUM(A1)'), `\"'-SUM(A1)\"`);
  assert.equal(csvCell('@cmd'), `\"'@cmd\"`);
  assert.equal(csvCell('Walleye'), '"Walleye"');
});

// ---------------------------------------------------------------------------
// 3. Catch filter + edit validation
// ---------------------------------------------------------------------------
test('catch filter is case-insensitive and null-safe', () => {
  const item = {
    species: 'Largemouth Bass',
    commonName: 'largemouth bass',
    locationName: 'Rice Lake',
    baitUsed: 'Senko',
    notes: undefined as unknown as string,
  };
  assert.equal(catchMatchesFilters(item, 'RICE', 'ALL'), true);
  assert.equal(catchMatchesFilters(item, '', 'Largemouth Bass'), true);
  assert.equal(catchMatchesFilters(item, '', 'LARGEMOUTH BASS'), true);
  assert.equal(catchMatchesFilters(item, 'pike', 'ALL'), false);
});

test('parsePositiveMeasurement rejects non-positive / non-numeric input', () => {
  assert.equal(parsePositiveMeasurement('').ok, true);
  assert.equal(parsePositiveMeasurement('12.5').ok, true);
  assert.equal(parsePositiveMeasurement('abc').ok, false);
  assert.equal(parsePositiveMeasurement('-2').ok, false);
  assert.equal(parsePositiveMeasurement('0').ok, false);
});

// ---------------------------------------------------------------------------
// 4. Insights NaN prevention
// ---------------------------------------------------------------------------
function sampleCatch(overrides: Partial<CatchLogItem> = {}): CatchLogItem {
  return {
    id: '1',
    timestamp: '2026-07-12T14:00:00.000Z',
    formattedDate: 'Jul 12, 2026',
    species: 'Walleye',
    commonName: 'Walleye',
    scientificName: '',
    photoUrl: '',
    estimatedLength: '20 inches',
    estimatedWeight: '3 lbs',
    baitUsed: 'Jig',
    locationName: 'Bay',
    notes: '',
    ...overrides,
  };
}

test('analyzeCatches does not emit NaN hour ranges for bad timestamps', () => {
  const report = analyzeCatches([
    sampleCatch({ id: 'bad', timestamp: 'not-a-date' }),
    sampleCatch({ id: 'good', timestamp: '2026-07-12T08:30:00.000Z' }),
  ]);
  assert.equal(report.bestHourRange.includes('NaN'), false);
  assert.match(report.bestHourRange, /\d/);
});

test('analyzeCatches keeps dash hour range when all timestamps are bad', () => {
  const report = analyzeCatches([sampleCatch({ timestamp: 'garbage' })]);
  assert.equal(report.bestHourRange, '—');
});

test('parseWeightLbs / parseLengthInches reject non-finite values', async () => {
  const { parseWeightLbs, parseLengthInches } = await import('./insights.js');
  assert.equal(parseWeightLbs('3 lbs'), 3);
  assert.equal(parseLengthInches('20 inches'), 20);
  assert.equal(parseWeightLbs('Not weighed'), null);
  assert.equal(parseLengthInches('Not measured'), null);
});

// ---------------------------------------------------------------------------
// 6. Ontario lake search tokenization
// ---------------------------------------------------------------------------
test('tokenizeLakeQuery drops lake stop-words so Simcoe matches', () => {
  assert.deepEqual(tokenizeLakeQuery('Lake Simcoe'), ['Simcoe']);
  assert.deepEqual(tokenizeLakeQuery('rice lake'), ['rice']);
});

test('buildLakeNameWhere requires every meaningful token', () => {
  const where = buildLakeNameWhere('Big Rideau Lake');
  assert.ok(where);
  assert.match(where!, /OFFICIAL_NAME LIKE '%Big%'/);
  assert.match(where!, /OFFICIAL_NAME LIKE '%Rideau%'/);
  assert.match(where!, /ENTITY_TYPE LIKE '%Lake%'/);
  // "Lake" is a stop word — must not appear as an OFFICIAL_NAME token requirement
  assert.equal(where!.includes("OFFICIAL_NAME LIKE '%Lake%'"), false);
});

test("buildLakeNameWhere keeps apostrophes in names like O'Hara", () => {
  const where = buildLakeNameWhere("Lake O'Hara");
  assert.ok(where?.includes("OFFICIAL_NAME LIKE '%O''Hara%'"));
});

test('buildLakeNameWhere rejects illegal characters', () => {
  assert.equal(buildLakeNameWhere('a'), null);
  assert.equal(buildLakeNameWhere('drop; table'), null);
});

// ---------------------------------------------------------------------------
// 7. Tackle quantity validation
// ---------------------------------------------------------------------------
test('normalizeTackleQuantity accepts only whole numbers 1–9999', () => {
  assert.equal(normalizeTackleQuantity(3), 3);
  assert.equal(normalizeTackleQuantity('12'), 12);
  assert.equal(normalizeTackleQuantity(0), null);
  assert.equal(normalizeTackleQuantity(-1), null);
  assert.equal(normalizeTackleQuantity(1.5), null);
  assert.equal(normalizeTackleQuantity(Number.NaN), null);
  assert.equal(normalizeTackleQuantity(10000), null);
});

// ---------------------------------------------------------------------------
// 8. Vision confidence bands (no hard-coded High Confidence)
// ---------------------------------------------------------------------------
test('confidenceBand reflects actual scores', () => {
  assert.equal(confidenceBand(90), 'HIGH');
  assert.equal(confidenceBand(60), 'MEDIUM');
  assert.equal(confidenceBand(40), 'LOW');
  assert.equal(confidenceBand(10), 'UNCERTAIN');
  assert.equal(confidenceBand(Number.NaN), 'UNCERTAIN');
  assert.equal(confidenceBandLabel('HIGH'), 'High Confidence');
  assert.equal(confidenceBandLabel('UNCERTAIN'), 'Uncertain ID');
});
