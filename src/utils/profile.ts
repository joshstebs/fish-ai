// ============================================================================
// Angler profile: home water + target species + tackle box.
// Persisted to localStorage, matching how the rest of fish-ai stores data
// (no fabricated defaults — a new user starts with no home water, and the
// SetupFlow walks them through setting one).
// ============================================================================
import { DEFAULT_SPECIES, DEFAULT_TACKLE, GeoLocation, LureId, SpeciesId } from './fishing';

export type AnglerProfile = {
  location: GeoLocation | null;
  species: SpeciesId;
  tackle: LureId[];
};

const STORAGE_KEY = 'fishai.profile.v1';

export const EMPTY_PROFILE: AnglerProfile = {
  location: null,
  species: DEFAULT_SPECIES,
  tackle: DEFAULT_TACKLE,
};

export function loadProfile(): AnglerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROFILE;
    const parsed = JSON.parse(raw) as Partial<AnglerProfile>;
    return {
      location: parsed.location ?? null,
      species: parsed.species ?? DEFAULT_SPECIES,
      tackle: parsed.tackle?.length ? parsed.tackle : DEFAULT_TACKLE,
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

export function saveProfile(profile: AnglerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable — keep in-memory */
  }
}

/** True when the user has gone through setup and picked a home water. */
export function hasHomeWater(profile: AnglerProfile): boolean {
  return Boolean(profile.location?.latitude != null && profile.location?.longitude != null);
}
