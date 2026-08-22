export interface WeatherSnapshot {
  temperatureF: number;
  condition: string;
  windSpeedMph: number;
  windDirection: string;
  barometricPressureInHg: number;
  waterTempF?: number;
  /** Where this snapshot came from: 'live' (Open-Meteo), 'manual' (user entered), 'none' */
  source?: 'live' | 'manual' | 'none';
  /** ISO timestamp when a live snapshot was fetched */
  fetchedAt?: string;
}

export interface CatchLogItem {
  id: string;
  timestamp: string; // ISO date string
  formattedDate: string;
  species: string;
  commonName: string;
  scientificName: string;
  photoUrl: string;
  estimatedLength: string;
  estimatedWeight: string;
  weather?: WeatherSnapshot;
  baitUsed: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  waterClarity?: 'CLEAR' | 'STAINED' | 'MUDDY';
  waterDepthFeet?: number;
  notes: string;
  legalStatus?: string;
  lureColor?: string;
  technique?: string;
}

export type SpotPrivacyLevel = 'PRIVATE' | 'FRIENDS' | 'APPROXIMATE' | 'PUBLIC';

export interface FishingSpot {
  id: string;
  name: string;
  waterBody: string;
  latitude: number;
  longitude: number;
  rating: number;
  totalCatches: number;
  topSpecies: string;
  bestBait: string;
  waterClarity: 'CLEAR' | 'STAINED' | 'MUDDY';
  averageDepthFeet: number;
  notes: string;
  /** Privacy level — exact coordinates are never shared without the user choosing PUBLIC */
  privacyLevel?: SpotPrivacyLevel;
}

export interface TackleItem {
  id: string;
  name: string;
  category: 'SOFT_PLASTICS' | 'HARD_BAITS' | 'SPINNERS_SPOONS' | 'HOOKS_RIGS' | 'LINE_REELS';
  colorPattern: string;
  quantity: number;
  notes: string;
}

// ============================================================================
// LIVE WEATHER (Open-Meteo — free, no API key required)
// ============================================================================
export interface LiveWeather {
  latitude: number;
  longitude: number;
  timezone: string;
  fetchedAt: string; // ISO
  current: {
    temperatureF: number;
    windSpeedMph: number;
    windDirectionDeg: number;
    windDirection: string; // compass
    pressureInHg: number;
    precipitationMm: number;
    cloudCoverPct: number;
    weatherCode: number;
    condition: string;
    isDay: boolean;
    relativeHumidityPct?: number;
    dewPointF?: number;
    visibilityMi?: number;
  };
  /** Hourly forecast for today+tomorrow (ISO hour -> snapshot) */
  hourly: {
    time: string; // ISO
    temperatureF: number;
    windSpeedMph: number;
    pressureInHg: number;
    precipitationMm: number;
    cloudCoverPct: number;
    condition: string;
  }[];
  /** Pressure trend over the last 6 hours: 'RISING' | 'STEADY' | 'FALLING' */
  pressureTrend: 'RISING' | 'STEADY' | 'FALLING';
  /** Pressure delta inHg over the last 6 hours (positive = rising) */
  pressureDelta6h: number;
}

// ============================================================================
// SOLUNAR / ASTRONOMY
// ============================================================================
export interface MoonInfo {
  illuminationPct: number;
  phaseName: string;
  ageDays: number;
  /** ISO of next new moon */
  nextNewMoon: string;
  /** ISO of next full moon */
  nextFullMoon: string;
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
}

export interface SolunarPeriod {
  type: 'MAJOR' | 'MINOR';
  start: Date;
  end: Date;
  rating: 'VERY HIGH' | 'HIGH' | 'MODERATE';
  description: string;
}

// ============================================================================
// FISHING CONDITIONS REPORT (honest scoring)
// ============================================================================
export interface ReportFactor {
  label: string;
  impact: 'HELPS' | 'HURTS' | 'NEUTRAL';
  detail: string;
  /** true when this factor comes from the user's own catch history */
  fromHistory?: boolean;
}

export interface FishingConditionsReport {
  targetSpecies: string;
  score: number; // 0-100
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  summary: string;
  bestWindow: { start: string; end: string } | null; // "6:10 AM" style
  factors: ReportFactor[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Honesty disclaimer shown in the UI */
  caveat: string;
}

// ============================================================================
// INSIGHTS (personal learning loop)
// ============================================================================
export interface SpeciesStat {
  commonName: string;
  count: number;
  avgWeightLbs: number | null;
  biggestWeightLbs: number | null;
  longestInches: number | null;
  topBait: string;
  topSpot: string;
}

export interface PatternInsight {
  id: string;
  title: string;
  detail: string;
  emoji: string;
  /** sample size behind this insight — small samples get lower confidence */
  sampleSize: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface InsightsReport {
  speciesStats: SpeciesStat[];
  personalBests: { commonName: string; weightLbs: number; catch: CatchLogItem }[];
  bestHourRange: string;
  bestLure: { name: string; catches: number } | null;
  bestSpot: { name: string; catches: number } | null;
  bestSkyCondition: { condition: string; catches: number } | null;
  bestPressureRange: string;
  patterns: PatternInsight[];
  totalCatches: number;
  speciesCount: number;
}

// ============================================================================
// ASSISTANT CHAT
// ============================================================================
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** when present, the message is a structured suggestion card */
  suggestions?: string[];
  timestamp: string;
}
