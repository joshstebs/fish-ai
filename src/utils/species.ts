// Single source of truth for the curated/common species list.
// Previously duplicated across FishReportView (CURATED_SPECIES) and
// CatchLogbookView (MANUAL_SPECIES), which drifted and added bloat.
export const SPECIES_OPTIONS: string[] = [
  'Largemouth Bass',
  'Smallmouth Bass',
  'Northern Pike',
  'Walleye',
  'Rainbow Trout',
  'Brown Trout',
  'Catfish',
  'Crappie',
  'Bluegill',
  'Yellow Perch',
  'Red Drum',
  'Snook',
  'Tarpon',
  'Muskellunge',
  'Other / Custom',
];

// Options without the manual "Other / Custom" escape hatch — used where the
// user is selecting a target species (no free-form entry needed).
export const CURATED_SPECIES: string[] = SPECIES_OPTIONS.filter(
  (s) => s !== 'Other / Custom'
);
