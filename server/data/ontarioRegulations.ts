// Ontario fishing regulations (2026).
// Source: Ontario Fishing Regulations Summary (ontario.ca)
// Note: Regulations vary by Fisheries Management Zone (FMZ).
// These are common province-wide rules; users should verify their specific FMZ.
// Josh fishes in the Windsor/Essex area (FMZ 19).

export interface SpeciesRegulation {
  species: string;
  scientificName: string;
  sportLimit: number;
  conservationLimit: number;
  sizeRule: string;
  season: string;
  notes?: string;
}

export const ONTARIO_REGULATIONS: Record<string, SpeciesRegulation> = {
  walleye: {
    species: "Walleye",
    scientificName: "Sander vitreus",
    sportLimit: 4,
    conservationLimit: 2,
    sizeRule: "Varies by FMZ. Common: none between 43-60cm (protected slot), max 1 over 60cm. FMZ 19: check local rules.",
    season: "Varies by FMZ. Typically 2nd Sat May to Dec 31.",
    notes: "Sauger often combined with walleye limit. Non-residents may have reduced limits.",
  },
  sauger: {
    species: "Sauger",
    scientificName: "Sander canadensis",
    sportLimit: 4,
    conservationLimit: 2,
    sizeRule: "Often combined with walleye. Check FMZ for slot limits.",
    season: "Same as walleye in most zones.",
  },
  northern_pike: {
    species: "Northern Pike",
    scientificName: "Esox lucius",
    sportLimit: 6,
    conservationLimit: 2,
    sizeRule: "Varies by FMZ. Common: none over 86cm, or slot 61-86cm.",
    season: "Open all year in most zones. Some zones closed Apr 1 - May 15.",
  },
  largemouth_bass: {
    species: "Largemouth Bass",
    scientificName: "Micropterus salmoides",
    sportLimit: 6,
    conservationLimit: 2,
    sizeRule: "Combined with smallmouth. No size limit in most zones during open season.",
    season: "3rd Sat June to Nov 30 (most zones). Catch-and-release only in spring.",
    notes: "Combined limit with smallmouth bass.",
  },
  smallmouth_bass: {
    species: "Smallmouth Bass",
    scientificName: "Micropterus dolomieu",
    sportLimit: 6,
    conservationLimit: 2,
    sizeRule: "Combined with largemouth. No size limit in most zones during open season.",
    season: "3rd Sat June to Nov 30 (most zones).",
    notes: "Combined limit with largemouth bass.",
  },
  muskellunge: {
    species: "Muskellunge",
    scientificName: "Esox masquinongy",
    sportLimit: 1,
    conservationLimit: 0,
    sizeRule: "Must be over 112cm (44in) minimum. Some waters require 137cm (54in).",
    season: "1st Sat June to Dec 15.",
    notes: "Conservation license holders must release all muskie. Highly regulated.",
  },
  yellow_perch: {
    species: "Yellow Perch",
    scientificName: "Perca flavescens",
    sportLimit: 50,
    conservationLimit: 25,
    sizeRule: "No size limit.",
    season: "Open all year.",
  },
  lake_trout: {
    species: "Lake Trout",
    scientificName: "Salvelinus namaycush",
    sportLimit: 2,
    conservationLimit: 1,
    sizeRule: "No size limit in most zones. Some lakes have slot limits.",
    season: "Jan 1 to Sep 30 (most zones).",
  },
  brook_trout: {
    species: "Brook Trout",
    scientificName: "Salvelinus fontinalis",
    sportLimit: 5,
    conservationLimit: 2,
    sizeRule: "Varies. Common: max 2 over 30cm, max 1 over 40cm.",
    season: "Varies by FMZ.",
  },
  rainbow_trout: {
    species: "Rainbow Trout",
    scientificName: "Oncorhynchus mykiss",
    sportLimit: 5,
    conservationLimit: 2,
    sizeRule: "Varies by FMZ.",
    season: "Varies by FMZ.",
    notes: "Includes steelhead.",
  },
  brown_trout: {
    species: "Brown Trout",
    scientificName: "Salmo trutta",
    sportLimit: 5,
    conservationLimit: 2,
    sizeRule: "Varies by FMZ.",
    season: "Varies by FMZ.",
  },
  crappie: {
    species: "Crappie (Black/White)",
    scientificName: "Pomoxis spp.",
    sportLimit: 30,
    conservationLimit: 10,
    sizeRule: "No size limit.",
    season: "Open all year.",
  },
  sunfish: {
    species: "Sunfish (Bluegill/Pumpkinseed)",
    scientificName: "Lepomis spp.",
    sportLimit: 300,
    conservationLimit: 15,
    sizeRule: "Only 30 may be over 18cm (sport).",
    season: "Open all year.",
  },
  channel_catfish: {
    species: "Channel Catfish",
    scientificName: "Ictalurus punctatus",
    sportLimit: 12,
    conservationLimit: 6,
    sizeRule: "No size limit.",
    season: "Open all year.",
  },
  common_carp: {
    species: "Common Carp",
    scientificName: "Cyprinus carpio",
    sportLimit: 100,
    conservationLimit: 50,
    sizeRule: "No size limit. Invasive species - no limit in some waters.",
    season: "Open all year.",
  },
};

export function getOntarioRegulation(speciesKey: string): SpeciesRegulation | undefined {
  const key = speciesKey.toLowerCase().replace(/[^a-z_]/g, "_");
  return ONTARIO_REGULATIONS[key];
}

export const ONTARIO_DISCLAIMER =
  "Ontario regulations vary by Fisheries Management Zone (FMZ). " +
  "These are general guidelines. Always verify current rules for your specific " +
  "FMZ at ontario.ca/fishing before keeping fish.";
