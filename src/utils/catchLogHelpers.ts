import { CatchLogItem } from '../types/catchLogTypes';

/** Case-insensitive, null-safe match for logbook search + species filter. */
export function catchMatchesFilters(
  item: Pick<CatchLogItem, 'species' | 'commonName' | 'locationName' | 'baitUsed' | 'notes'>,
  searchQuery: string,
  selectedSpeciesFilter: string,
): boolean {
  const q = searchQuery.trim().toLowerCase();
  const haystacks = [item.species, item.commonName, item.locationName, item.baitUsed, item.notes]
    .map((v) => (v ?? '').toLowerCase());

  const matchesSearch = !q || haystacks.some((h) => h.includes(q));

  if (selectedSpeciesFilter === 'ALL') return matchesSearch;

  const filter = selectedSpeciesFilter.trim().toLowerCase();
  const speciesHay = [(item.species ?? '').toLowerCase(), (item.commonName ?? '').toLowerCase()];
  const matchesSpecies = speciesHay.some((h) => h.includes(filter));
  return matchesSearch && matchesSpecies;
}

/** Validate optional length/weight inputs for quick-log / edit forms. */
export function parsePositiveMeasurement(raw: string): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: NaN }; // empty = not provided
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: 'Length and weight must be positive numbers when provided.' };
  }
  return { ok: true, value };
}

export function normalizeTackleQuantity(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 9999) return null;
  return n;
}

/** Map AI confidence percentage to an honest UI band (never invent "High"). */
export function confidenceBand(confidence: number): 'HIGH' | 'MEDIUM' | 'LOW' | 'UNCERTAIN' {
  if (!Number.isFinite(confidence)) return 'UNCERTAIN';
  if (confidence >= 75) return 'HIGH';
  if (confidence >= 50) return 'MEDIUM';
  if (confidence >= 25) return 'LOW';
  return 'UNCERTAIN';
}

export function confidenceBandLabel(band: ReturnType<typeof confidenceBand>): string {
  switch (band) {
    case 'HIGH':
      return 'High Confidence';
    case 'MEDIUM':
      return 'Medium Confidence';
    case 'LOW':
      return 'Low Confidence';
    default:
      return 'Uncertain ID';
  }
}
