import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Anchor,
  Clock,
  Cloud,
  CloudOff,
  CloudRain,
  CloudSun,
  Fish,
  Gauge,
  History,
  MapPin,
  Minus,
  Moon,
  RefreshCw,
  Sun,
  Target,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Wind,
} from 'lucide-react';
import {
  CatchLogItem,
  FishingConditionsReport,
  FishingSpot,
  LiveWeather,
  ReportFactor,
} from '../types/catchLogTypes';
import { buildFishReport, recommendLures, suggestTargetSpecies } from '../utils/report';
import { fetchLiveWeather, resolveWeatherCoords } from '../utils/weather';
import { formatTime, getMoonInfo, getSolunarPeriods, getSunTimes } from '../utils/solunar';
import { speciesOf } from '../utils/insights';

interface FishReportViewProps {
  catches: CatchLogItem[];
  spots: FishingSpot[];
}

/** Curated species list — shown alongside any species actually logged by the user. */
const CURATED_SPECIES = [
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
];

const GRADE_STYLES: Record<FishingConditionsReport['grade'], string> = {
  EXCELLENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40',
  GOOD: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40',
  FAIR: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
  POOR: 'bg-red-500/10 text-red-400 border-red-500/40',
};

const CONFIDENCE_STYLES: Record<FishingConditionsReport['confidence'], string> = {
  HIGH: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40',
  MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
  LOW: 'bg-red-500/10 text-red-400 border-red-500/40',
};

const IMPACT_STYLES: Record<ReportFactor['impact'], string> = {
  HELPS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  HURTS: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  NEUTRAL: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

function impactIcon(impact: ReportFactor['impact']) {
  if (impact === 'HELPS') return <TrendingUp className="w-3 h-3" />;
  if (impact === 'HURTS') return <TrendingDown className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
}

export const FishReportView: React.FC<FishReportViewProps> = ({ catches, spots }) => {
  const [species, setSpecies] = useState<string>(() => suggestTargetSpecies(catches));
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    const c = await resolveWeatherCoords(spots);
    setCoords(c);
    if (!c) {
      setWeather(null);
      setWeatherLoading(false);
      return;
    }
    const w = await fetchLiveWeather(c.latitude, c.longitude);
    setWeather(w);
    if (!w) {
      setWeatherError('Live weather service unreachable. Check your connection and refresh.');
    }
    setWeatherLoading(false);
  }, [spots]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather, refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Resolved coordinates: the geolocation/spot resolution result, or a direct
  // fallback to the first spot that has coordinates.
  const effectiveCoords = useMemo(() => {
    if (coords) return coords;
    const spot = spots.find((s) => typeof s.latitude === 'number' && typeof s.longitude === 'number');
    return spot ? { latitude: spot.latitude, longitude: spot.longitude } : null;
  }, [coords, spots]);

  // Real astronomy for the report: moon phase, sun times, solunar windows.
  const astro = useMemo(() => {
    if (!effectiveCoords) return null;
    const now = new Date();
    return {
      now,
      moon: getMoonInfo(now),
      sun: getSunTimes(now, effectiveCoords.latitude, effectiveCoords.longitude),
      solunar: getSolunarPeriods(now, effectiveCoords.latitude, effectiveCoords.longitude),
    };
  }, [effectiveCoords]);

  const report = useMemo<FishingConditionsReport | null>(() => {
    if (!astro) return null;
    return buildFishReport({
      species,
      weather,
      moon: astro.moon,
      sun: astro.sun,
      solunar: astro.solunar,
      catches,
      now: astro.now,
    });
  }, [astro, species, weather, catches]);

  const lures = useMemo(
    () => recommendLures(catches, species, weather, 3),
    [catches, species, weather]
  );

  // Species options: everything the user has actually caught, plus the curated list.
  const speciesOptions = useMemo(() => {
    const logged = catches.map((c) => speciesOf(c));
    return Array.from(new Set([...logged, ...CURATED_SPECIES]));
  }, [catches]);

  const majorCount = astro ? astro.solunar.filter((p) => p.type === 'MAJOR').length : 0;
  const minorCount = astro ? astro.solunar.filter((p) => p.type === 'MINOR').length : 0;

  // Styling helper for the live pressure trend (RISING / STEADY / FALLING).
  const pressureTrendColor =
    weather?.pressureTrend === 'RISING'
      ? 'text-emerald-400'
      : weather?.pressureTrend === 'FALLING'
        ? 'text-amber-400'
        : 'text-slate-500';

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-slate-900 border-l-4 border-cyan-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-cyan-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded">
              FishAI Conditions Engine
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" /> Live Weather Powered
            </span>
          </div>
          <h2 className="text-3xl font-display font-black uppercase text-white tracking-tight flex items-center gap-2">
            🎣 Today's Fish Report
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            An honest, personalized conditions score for your target species — built from real live weather, real solunar math, and your own catch history.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={weatherLoading}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-700 flex items-center gap-2 transition-all shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${weatherLoading ? 'animate-spin' : ''}`} />
          <span>{weatherLoading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 border border-white/10 rounded-xl shadow-lg">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Target className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 hidden sm:inline">
            Target Species
          </span>
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="bg-slate-950 text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg border border-slate-800 focus:outline-none cursor-pointer w-full sm:w-auto font-mono"
          >
            {speciesOptions.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="font-bold uppercase">
            {effectiveCoords
              ? `${effectiveCoords.latitude.toFixed(2)}°, ${effectiveCoords.longitude.toFixed(2)}°`
              : 'Location Needed'}
          </span>
          {weather && (
            <span className="text-emerald-400 font-black uppercase">● Live</span>
          )}
        </div>
      </div>

      {/* Weather unavailable notice (honest, with retry) */}
      {!weatherLoading && !weather && effectiveCoords && (
        <div className="bg-amber-950/40 border border-amber-500/30 p-5 rounded-xl text-amber-200 text-xs font-mono flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-bold">{weatherError || 'Live weather unavailable.'}</p>
            <p className="text-amber-300/70">
              The score below uses solunar math and your catch history only — no fake weather is shown. Try refreshing, or check your connection.
            </p>
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase tracking-wider rounded border border-amber-500/40 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3 h-3" /> Retry Weather
            </button>
          </div>
        </div>
      )}

      {weatherLoading ? (
        /* Loading skeleton while weather resolves */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-xl space-y-4">
            <div className="h-3 w-48 bg-slate-800 rounded animate-pulse" />
            <div className="flex items-end gap-3">
              <div className="h-16 w-28 bg-slate-800 rounded animate-pulse" />
              <div className="h-6 w-24 bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="h-4 w-full max-w-lg bg-slate-800 rounded animate-pulse" />
            <div className="h-14 bg-slate-800/60 rounded-lg animate-pulse" />
          </div>
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-xl space-y-4">
            <div className="h-4 w-52 bg-slate-800 rounded animate-pulse" />
            <div className="h-12 bg-slate-800/60 rounded-lg animate-pulse" />
            <div className="h-12 bg-slate-800/60 rounded-lg animate-pulse" />
            <div className="h-12 bg-slate-800/60 rounded-lg animate-pulse" />
          </div>
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-xl space-y-4">
            <div className="h-4 w-64 bg-slate-800 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-20 bg-slate-800/60 rounded-lg animate-pulse" />
              <div className="h-20 bg-slate-800/60 rounded-lg animate-pulse" />
              <div className="h-20 bg-slate-800/60 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      ) : !effectiveCoords ? (
        /* Honest empty state: no coordinates available */
        <div className="bg-slate-900 border border-white/10 rounded-xl p-12 text-center space-y-4 shadow-xl">
          <MapPin className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-black uppercase tracking-wider text-white">
            Location Needed for Your Report
          </h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Add a fishing spot with coordinates in your Spot Tracker, or allow browser
            location access, to get your personalized conditions report. Without a
            location there's no honest way to compute sun times, solunar windows, or
            live weather for you.
          </p>
        </div>
      ) : report ? (
        <>
          {/* Hero: Bite Confidence score */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 inline-flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Bite Confidence · {report.targetSpecies}
              </span>
              <div className="mt-4 flex items-end justify-center gap-4">
                <span className="text-5xl sm:text-6xl font-black font-mono leading-none text-emerald-400">
                  {report.score}
                </span>
                <span
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded border mb-1 ${GRADE_STYLES[report.grade]}`}
                >
                  {report.grade}
                </span>
              </div>
              <div className="mt-5 max-w-xs mx-auto">
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${report.score}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-slate-300 mt-4 max-w-xl mx-auto">{report.summary}</p>
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded border ${CONFIDENCE_STYLES[report.confidence]}`}
                >
                  Confidence: {report.confidence}
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {weather ? 'with live weather' : 'solunar + history only'}
                </span>
              </div>
            </div>
          </div>

          {/* Live weather chips (real data only) */}
          {weather && (
            <div className="bg-slate-900 border border-white/10 rounded-xl shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <CloudSun className="w-5 h-5 text-amber-400" /> Live Conditions
                </h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">
                  fetched {formatTime(new Date(weather.fetchedAt))}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-slate-900/60 border border-white/10 rounded-lg p-2.5 min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-amber-400" /> Temperature
                  </span>
                  <span className="text-sm font-black font-mono text-white block mt-1 truncate">
                    {weather.current.temperatureF}°F
                  </span>
                </div>
                <div className="bg-slate-900/60 border border-white/10 rounded-lg p-2.5 min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Wind className="w-3 h-3 text-cyan-400" /> Wind
                  </span>
                  <span className="text-sm font-black font-mono text-white block mt-1 truncate">
                    {weather.current.windSpeedMph} mph {weather.current.windDirection}
                  </span>
                </div>
                <div className="bg-slate-900/60 border border-white/10 rounded-lg p-2.5 min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-purple-400" /> Pressure
                  </span>
                  <span className="text-sm font-black font-mono text-white block mt-1 truncate">
                    {weather.current.pressureInHg} inHg
                  </span>
                  <span className={`text-[9px] font-mono font-black uppercase ${pressureTrendColor}`}>
                    {weather.pressureTrend}
                  </span>
                </div>
                <div className="bg-slate-900/60 border border-white/10 rounded-lg p-2.5 min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-blue-400" /> Precipitation
                  </span>
                  <span className="text-sm font-black font-mono text-white block mt-1 truncate">
                    {weather.current.precipitationMm} mm
                  </span>
                </div>
                <div className="bg-slate-900/60 border border-white/10 rounded-lg p-2.5 min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-slate-400" /> Cloud Cover
                  </span>
                  <span className="text-sm font-black font-mono text-white block mt-1 truncate">
                    {weather.current.cloudCoverPct}%
                  </span>
                </div>
                <div className="bg-slate-900/60 border border-white/10 rounded-lg p-2.5 min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <CloudSun className="w-3 h-3 text-amber-400" /> Conditions
                  </span>
                  <span className="text-sm font-black font-mono text-white block mt-1 truncate">
                    {weather.current.condition}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Best Window — prominent */}
          <div className="bg-slate-900 border border-white/10 border-l-4 border-l-emerald-500/70 rounded-xl shadow-xl p-5 flex items-center gap-4">
            <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Best Window Today
              </span>
              {report.bestWindow ? (
                <span className="text-xl font-black font-mono text-white">
                  {report.bestWindow.start} – {report.bestWindow.end}
                </span>
              ) : (
                <span className="text-sm font-mono text-slate-400">
                  No standout window in the next few hours.
                </span>
              )}
            </div>
          </div>

          {/* Real astronomy strip */}
          {astro && (
            <div className="bg-slate-900 border border-white/10 rounded-xl shadow-xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2 min-w-0">
                  <Moon className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Moon</span>
                    <span className="text-[11px] font-black text-white block truncate">
                      {astro.moon.phaseName} · {astro.moon.illuminationPct}%
                    </span>
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2 min-w-0">
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Sunrise</span>
                    <span className="text-[11px] font-black text-white block truncate">
                      {astro.sun ? formatTime(astro.sun.sunrise) : '—'}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2 min-w-0">
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Sunset</span>
                    <span className="text-[11px] font-black text-white block truncate">
                      {astro.sun ? formatTime(astro.sun.sunset) : '—'}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2 min-w-0">
                  <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Solunar</span>
                    <span className="text-[11px] font-black text-white block truncate">
                      {majorCount} major · {minorCount} minor windows
                    </span>
                  </div>
                </div>
              </div>
              </div>
            )}

          {/* Factors */}
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-xl space-y-4">
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" /> What's Driving the Score
            </h3>
            <div className="divide-y divide-slate-800/60">
              {report.factors.map((f, i) => (
                <div
                  key={i}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        {f.label}
                      </span>
                      {f.fromHistory && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-0.5">
                          <History className="w-2.5 h-2.5" /> your history
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.detail}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-[9px] font-mono font-black uppercase rounded-full border shrink-0 flex items-center gap-1 ${IMPACT_STYLES[f.impact]}`}
                  >
                    {impactIcon(f.impact)} {f.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Lures */}
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl shadow-xl space-y-4">
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Anchor className="w-5 h-5 text-amber-400" /> Recommended Lures for Today
            </h3>
            {lures.length === 0 ? (
              <p className="text-xs text-slate-400">
                Log a few {species} catches or connect live weather to get lure
                recommendations — no guesses here.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lures.map((l, i) => (
                  <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-white flex items-center gap-1.5">
                        <Fish className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {l.name}
                      </span>
                      {l.catches > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                          {l.catches} catch{l.catches === 1 ? '' : 'es'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 leading-relaxed">{l.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caveat */}
          <p className="text-[11px] text-slate-500 font-mono italic px-1">{report.caveat}</p>
        </>
      ) : (
        <div className="bg-slate-900 border border-white/10 rounded-xl p-12 text-center space-y-4 shadow-xl">
          <CloudOff className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-black uppercase tracking-wider text-white">
            Report Unavailable
          </h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Something went wrong building today's report. Try refreshing.
          </p>
          <button
            onClick={handleRefresh}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-md inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}
    </div>
  );
};
