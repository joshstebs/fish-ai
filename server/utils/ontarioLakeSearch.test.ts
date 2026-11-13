import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLakeNameWhere, tokenizeLakeQuery } from './ontarioLakeSearch.js';

test('Lake Simcoe tokenizes to Simcoe for official-name match', () => {
  assert.deepEqual(tokenizeLakeQuery('Lake Simcoe'), ['Simcoe']);
  const where = buildLakeNameWhere('Lake Simcoe');
  assert.ok(where?.includes("OFFICIAL_NAME LIKE '%Simcoe%'"));
  assert.equal(where?.includes("OFFICIAL_NAME LIKE '%Lake Simcoe%'"), false);
});

test('multi-token queries require every token', () => {
  const where = buildLakeNameWhere('Big Rideau');
  assert.ok(where?.includes("OFFICIAL_NAME LIKE '%Big%'"));
  assert.ok(where?.includes("OFFICIAL_NAME LIKE '%Rideau%'"));
  assert.ok(where?.includes(' AND '));
});

test('apostrophes stay in the token and are SQL-escaped', () => {
  const where = buildLakeNameWhere("O'Hara");
  assert.ok(where?.includes("OFFICIAL_NAME LIKE '%O''Hara%'"), where ?? 'missing where');
});
