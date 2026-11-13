import { CatchLogItem, FishingSpot, TackleItem } from '../types/catchLogTypes';

const CATCHES_STORAGE_KEY = 'fish_ai_catch_logbook';
const SPOTS_STORAGE_KEY = 'fish_ai_fishing_spots';
const TACKLE_STORAGE_KEY = 'fish_ai_tackle_box';

/** Neutralize spreadsheet formula injection in exported CSV cells. */
export function csvCell(value: unknown): string {
  let text = String(value ?? '').replace(/"/g, '""');
  // Leading = + - @ (and tab/CR) can be interpreted as formulas by Excel/Sheets.
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return `"${text}"`;
}

export function exportCatchesToCSV(catches: CatchLogItem[]): void {
  if (catches.length === 0) return;
  const headers = ['Date', 'Species', 'Length', 'Weight', 'Location', 'Bait', 'Water Temp', 'Notes'];
  const rows = catches.map((c) => [
    csvCell(c.formattedDate),
    csvCell(c.species),
    csvCell(c.estimatedLength),
    csvCell(c.estimatedWeight),
    csvCell(c.locationName),
    csvCell(c.baitUsed),
    csvCell(c.weather?.waterTempF ?? ''),
    csvCell(c.notes),
  ]);
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.map(csvCell).join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `FishAI_Catch_Logbook_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function safeLoad(key: string): unknown | null {
  try {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(`Failed to load ${key} from local storage:`, e);
  }
  return null;
}

/** Load a JSON array from localStorage; malformed or non-array values yield []. */
export function loadStoredArray<T>(key: string): T[] {
  const parsed = safeLoad(key);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function safeSave(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to local storage:`, e);
  }
}

// --- Catches: a brand-new user starts EMPTY. No fabricated seed data. ---
export function loadStoredCatches(): CatchLogItem[] {
  return loadStoredArray<CatchLogItem>(CATCHES_STORAGE_KEY);
}

export function saveStoredCatches(catches: CatchLogItem[]): void {
  safeSave(CATCHES_STORAGE_KEY, catches);
}

// --- Spots: a brand-new user starts EMPTY. ---
export function loadStoredSpots(): FishingSpot[] {
  return loadStoredArray<FishingSpot>(SPOTS_STORAGE_KEY);
}

export function saveStoredSpots(spots: FishingSpot[]): void {
  safeSave(SPOTS_STORAGE_KEY, spots);
}

// --- Tackle box: persisted, starts EMPTY. ---
export function loadStoredTackle(): TackleItem[] {
  return loadStoredArray<TackleItem>(TACKLE_STORAGE_KEY);
}

export function saveStoredTackle(items: TackleItem[]): void {
  safeSave(TACKLE_STORAGE_KEY, items);
}
