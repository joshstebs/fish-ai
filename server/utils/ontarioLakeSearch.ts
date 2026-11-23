/**
 * Build an ArcGIS WHERE clause for Ontario Geographic Names lake search.
 * Tokenizes multi-word queries so "Lake Simcoe" matches official name "Simcoe"
 * (ENTITY_TYPE already constrains to lakes/reservoirs).
 */

const STOP_WORDS = new Set(['lake', 'lakes', 'reservoir', 'pond', 'the', 'of', 'and']);

export function tokenizeLakeQuery(raw: string): string[] | null {
  const name = raw.trim();
  if (!/^[a-zA-Z0-9 '-]{2,50}$/.test(name)) return null;

  // Split on spaces/hyphens only — keep apostrophes inside names (O'Hara).
  const tokens = name
    .split(/[\s-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t.toLowerCase()));

  // If every token was a stop word (e.g. just "Lake"), fall back to the raw string.
  if (tokens.length === 0) return [name];
  return tokens;
}

function sqlLikeEscape(value: string): string {
  return value.replace(/'/g, "''").replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/** ArcGIS WHERE fragment requiring every meaningful token to appear in OFFICIAL_NAME. */
export function buildLakeNameWhere(rawQuery: string): string | null {
  const tokens = tokenizeLakeQuery(rawQuery);
  if (!tokens) return null;

  const nameClauses = tokens
    .map((token) => `OFFICIAL_NAME LIKE '%${sqlLikeEscape(token)}%'`)
    .join(' AND ');

  return `(ENTITY_TYPE LIKE '%Lake%' OR ENTITY_TYPE LIKE '%Reservoir%') AND (${nameClauses})`;
}
