import { CatchLogItem, FishingSpot, TackleItem } from '../types/catchLogTypes';

const CATCHES_STORAGE_KEY = 'fish_ai_catch_logbook';
const SPOTS_STORAGE_KEY = 'fish_ai_fishing_spots';
const TACKLE_STORAGE_KEY = 'fish_ai_tackle_box';

export function exportCatchesToCSV(catches: CatchLogItem[]): void {
  if (catches.length === 0) return;
  const headers = ['Date', 'Species', 'Length', 'Weight', 'Location', 'Bait', 'Water Temp', 'Notes'];
  const rows = catches.map((c) => [
    `"${c.formattedDate}"`,
    `"${c.species}"`,
    `"${c.estimatedLength}"`,
    `"${c.estimatedWeight}"`,
    `"${c.locationName}"`,
    `"${c.baitUsed}"`,
    `"${c.weather?.waterTempF || ''}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`,
  ]);
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `FishAI_Catch_Logbook_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function safeLoad<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Failed to load ${key} from local storage:`, e);
  }
  return null;
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
  return safeLoad<CatchLogItem[]>(CATCHES_STORAGE_KEY) || [];
}

export function saveStoredCatches(catches: CatchLogItem[]): void {
  safeSave(CATCHES_STORAGE_KEY, catches);
}

// --- Spots: a brand-new user starts EMPTY. ---
export function loadStoredSpots(): FishingSpot[] {
  return safeLoad<FishingSpot[]>(SPOTS_STORAGE_KEY) || [];
}

export function saveStoredSpots(spots: FishingSpot[]): void {
  safeSave(SPOTS_STORAGE_KEY, spots);
}

// --- Tackle box: persisted, starts EMPTY. ---
export function loadStoredTackle(): TackleItem[] {
  return safeLoad<TackleItem[]>(TACKLE_STORAGE_KEY) || [];
}

export function saveStoredTackle(items: TackleItem[]): void {
  safeSave(TACKLE_STORAGE_KEY, items);
}
