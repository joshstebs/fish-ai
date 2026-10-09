// US fishing regulations (general guidance).
// Note: US regulations vary significantly by state.
// These are typical rules; users should verify their state regulations.

export interface SpeciesRegulation {
  species: string;
  scientificName: string;
  typicalLimit: string;
  sizeRule: string;
  season: string;
  notes?: string;
}

export const US_REGULATIONS: Record<string, SpeciesRegulation> = {
  walleye: {
    species: "Walleye",
    scientificName: "Sander vitreus",
    typicalLimit: "Varies by state (typically 4-6)",
    sizeRule: "Varies by state. Common: 15-inch minimum.",
    season: "Varies by state.",
    notes: "Check your state DNR for specific regulations.",
  },
  largemouth_bass: {
    species: "Largemouth Bass",
    scientificName: "Micropterus salmoides",
    typicalLimit: "Varies by state (typically 5-6)",
    sizeRule: "Common: 12-14 inch minimum.",
    season: "Varies by state.",
  },
  smallmouth_bass: {
    species: "Smallmouth Bass",
    scientificName: "Micropterus dolomieu",
    typicalLimit: "Varies by state (typically 5-6)",
    sizeRule: "Common: 12-14 inch minimum.",
    season: "Varies by state.",
  },
  northern_pike: {
    species: "Northern Pike",
    scientificName: "Esox lucius",
    typicalLimit: "Varies by state (typically 2-5)",
    sizeRule: "Common: 24-inch minimum.",
    season: "Varies by state.",
  },
  muskellunge: {
    species: "Muskellunge",
    scientificName: "Esox masquinongy",
    typicalLimit: "1 (most states)",
    sizeRule: "Common: 40-50 inch minimum.",
    season: "Varies by state.",
  },
  yellow_perch: {
    species: "Yellow Perch",
    scientificName: "Perca flavescens",
    typicalLimit: "Varies widely (25-50 typical)",
    sizeRule: "Usually no size limit.",
    season: "Open year-round in most states.",
  },
  crappie: {
    species: "Crappie",
    scientificName: "Pomoxis spp.",
    typicalLimit: "Varies (15-30 typical)",
    sizeRule: "Common: 9-10 inch minimum.",
    season: "Open year-round.",
  },
  channel_catfish: {
    species: "Channel Catfish",
    scientificName: "Ictalurus punctatus",
    typicalLimit: "Varies widely by state",
    sizeRule: "Usually no size limit.",
    season: "Open year-round.",
  },
};

export function getUSRegulation(speciesKey: string): SpeciesRegulation | undefined {
  const key = speciesKey.toLowerCase().replace(/[^a-z_]/g, "_");
  return US_REGULATIONS[key];
}

export const US_DISCLAIMER =
  "US fishing regulations vary by state. These are general guidelines only. " +
  "Always check your state's Department of Natural Resources (DNR) for current rules.";
