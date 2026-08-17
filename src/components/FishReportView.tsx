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
import { Fold } from './Fold';

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

/** Convert a "6:10 AM"-style clock string into a percent position across a 24h day. */
function timeToPct(timeStr: string): number {
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 0;
  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  const totalMinutes = Math.min(1439, hours * 60 + minutes);
  return (totalMinutes / (24 * 60)) * 100;
}

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

/**
 * Mini area/line chart of the REAL hourly barometer observations from the
 * LiveWeather object (never forecast, never invented). Renders only when the
 * caller has at least two observed pressure points.
 */
const PressureSparkline: React.FC<{
  points: { t: number; p: number }[];
  trend: LiveWeather['pressureTrend'];
}> = ({ points, trend }) => {
  const W = 240;
  const H = 40;
  const padX = 5;
  const padY = 5;
  const minP = Math.min(...points.map((x) => x.p));
  const maxP = Math.max(...points.map((x) => x.p));
  const range = maxP - minP || 0.01;
  const xAt = (i: number) => padX + (i / Math.max(1, points.length - 1)) * (W - padX * 2);
  const yAt = (p: number) => H - padY - ((p - minP) / range) * (H - padY * 2);
  const line = points.map((pt, i) => `${xAt(i).toFixed(1)},${yAt(pt.p).toFixed(1)}`).join(' ');
  const baseline = H - 1;
  const area = `${line} ${xAt(points.length - 1).toFixed(1)},${baseline} ${xAt(0).toFixed(1)},${baseline}`;
  const stroke = trend === 'RISING' ? '#10B981' : trend === 'FALLING' ? '#F59E0B' : '#22D3EE';
  const gradId = 'fishai-pressure-fill';
  const lastX = xAt(points.length - 1);
  const lastY = yAt(points[points.length - 1].p);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-10 block" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2" fill={stroke} />
    </svg>
  );
};

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
      setWeatherError('Weather service unreachable — check your connection.');
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

  // Real barometric-pressure history from the LiveWeather object: its hourly
  // array includes the past 6 hours of observations (weather.ts requests
  // past_hours=6). Filter to points at or before "now" — NEVER forecast
  // entries — so the mini trend is honest data. Null when there aren't at
  // least two observed points (then only the current-pressure stat is shown).
  const pressureHistory = useMemo(() => {
    if (!weather) return null;
    const now = Date.now();
    const observed = weather.hourly
      .filter((h) => new Date(h.time).getTime() <= now)
      .map((h) => ({ t: new Date(h.time).getTime(), p: h.pressureInHg }))
      .sort((a, b) => a.t - b.t)
      .slice(-7);
    if (observed.length < 2) return null;
    return {
      points: observed,
      spanHours: Math.max(1, Math.round((observed[observed.length - 1].t - observed[0].t) / 3.6e6)),
    };
  }, [weather]);

  // Best bite window expressed as 24h-percent positions for the horizontal bar.
  const biteWindow = useMemo(() => {
    if (!report || !report.bestWindow) return null;
    const startPct = Math.max(0, Math.min(100, timeToPct(report.bestWindow.start)));
    const endPct = Math.max(0, Math.min(100, timeToPct(report.bestWindow.end)));
    return {
      start: report.bestWindow.start,
      end: report.bestWindow.end,
      startPct,
      widthPct: Math.max(1.5, endPct - startPct),
    };
  }, [report]);

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

  // Human-readable pressure trend for the Recommended Approach sentence.
  const pressureTrendLabel =
    weather?.pressureTrend === 'RISING'
      ? 'rising pressure'
      : weather?.pressureTrend === 'FALLING'
        ? 'falling pressure'
        : 'steady pressure';

  return (
    <div className="fishai-premium-report space-y-6 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-slate-900 border-l-4 border-cyan-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-cyan-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded">
              Today's Fish Report
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" /> Live Data
            </span>
          </div>
          <h2 className="text-2xl font-display font-black uppercase text-white tracking-tight">
            Your Daily Fish Report
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Real conditions. Real times. Best bite window. Every day.
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

      {/* Target Zones — real spot names from the user's saved spots, never invented */}
      {spots.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-900/70 border border-cyan-500/20 p-4 rounded-xl shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 shrink-0">
            <Target className="w-3.5 h-3.5 text-cyan-400" /> Target Zones
          </span>
          <div className="flex flex-wrap gap-2">
            {spots.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/40 bg-cyan-500/5 text-cyan-300 font-mono text-[10px] font-bold uppercase tracking-wide"
              >
                <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

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
              Score uses solunar math and history only — no fake weather shown.
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
            Location Needed
          </h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Add a spot with coordinates or allow browser location to get your report.
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
              <div className="mt-4 flex items-end justify-center gap-4 flex-wrap">
                <span className="text-6xl sm:text-7xl font-black font-mono leading-none text-emerald-400 tabular-nums">
                  {report.score}
                  <span className="ml-0.5 text-2xl sm:text-3xl font-black text-white/90">%</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span
                    className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-full border ${GRADE_STYLES[report.grade]}`}
                  >
                    {report.grade}
                  </span>
                  <span
                    className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-full border ${CONFIDENCE_STYLES[report.confidence]}`}
                  >
                    {report.confidence} confidence
                  </span>
                </div>
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
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {weather ? 'with live weather' : 'solunar + history only'}
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Approach — the actionable call, eye-level (mockup anchor) */}
          <div className="bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl shadow-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Recommended Approach
              </span>
            </div>
            <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed max-w-2xl">
              {report.grade === 'POOR'
                ? 'Tough bite ahead — take your time, downsize your presentation, and fish the slow windows.'
                : `Best bite ${report.bestWindow ? `from ${report.bestWindow.start} to ${report.bestWindow.end}` : 'later in the day'}${lures[0] ? ` — lead with a ${lures[0].name.toLowerCase()}` : ''}${weather ? `, ${weather.current.condition.toLowerCase()} and ${pressureTrendLabel}` : ''}.`}
            </p>
            {lures.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Top pick:</span>
                {lures.slice(0, 2).map((l) => (
                  <span key={l.name} className="px-2 py-1 bg-slate-800/80 border border-white/10 rounded-md text-[10px] font-bold text-emerald-300 uppercase tracking-wide">
                    {l.name}
                  </span>
                ))}
              </div>
            )}
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
                <div className="col-span-2 sm:col-span-3 bg-slate-900/60 border border-white/10 rounded-lg p-3 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-purple-400" /> Pressure
                      <span className="text-slate-600 normal-case font-mono">· current + trend</span>
                    </span>
                    <span
                      className={`text-[9px] font-mono font-black uppercase flex items-center gap-1 ${pressureTrendColor}`}
                    >
                      {weather.pressureTrend === 'RISING' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : weather.pressureTrend === 'FALLING' ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      {weather.pressureTrend}
                      {pressureHistory
                        ? ` · ${weather.pressureTrend === 'RISING' ? '+' : weather.pressureTrend === 'FALLING' ? '−' : ''}${Math.abs(weather.pressureDelta6h).toFixed(2)} inHg/6h`
                        : ''}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black font-mono leading-none text-white tabular-nums">
                      {weather.current.pressureInHg.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">inHg</span>
                  </div>
                  {pressureHistory ? (
                    <div className="mt-2">
                      <PressureSparkline points={pressureHistory.points} trend={weather.pressureTrend} />
                      <div className="flex justify-between text-[8px] font-mono font-bold uppercase text-slate-600 mt-0.5">
                        <span>{pressureHistory.spanHours}h ago</span>
                        <span>Now</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[9px] font-mono text-slate-500 mt-1">
                      No hourly barometer history observed — showing the live reading only.
                    </p>
                  )}
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

          {/* Best Bite Window — 24h horizontal bar */}
          <div className="bg-slate-900 border border-white/10 border-l-4 border-l-cyan-500/70 rounded-xl shadow-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Best Bite Window
              </span>
              {biteWindow && (
                <span className="text-[10px] font-mono font-black uppercase text-cyan-300/80 shrink-0">
                  {biteWindow.start} – {biteWindow.end}
                </span>
              )}
            </div>
            {biteWindow ? (
              <>
                <div className="relative h-3 rounded-lg bg-slate-950 overflow-hidden">
                  <div
                    className="absolute inset-y-0 rounded-lg bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-300"
                    style={{ left: `${biteWindow.startPct}%`, width: `${biteWindow.widthPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono font-bold uppercase text-slate-600">
                  <span>12am</span>
                  <span>6am</span>
                  <span>12pm</span>
                  <span>6pm</span>
                  <span>12am</span>
                </div>
              </>
            ) : (
              <div className="border border-dashed border-slate-700 rounded-lg p-4 flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                <p className="text-xs font-mono text-slate-400">
                  No standout window in the next few hours — watch for the next solunar shift.
                </p>
              </div>
            )}
          </div>

          {/* Real astronomy strip (collapsible to keep the landing page tight) */}
          {astro && (
            <Fold
              title="Moon, Sun & Solunar"
              icon={<Moon className="w-4 h-4" />}
              badge={`${majorCount} major · ${minorCount} minor`}
            >
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
            </Fold>
          )}

          {/* Factors */}
          <Fold
            title="What's Driving the Score"
            icon={<Target className="w-5 h-5" />}
            defaultOpen
          >
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
          </Fold>

          {/* Equipment — real lure names, badged only on the user's personal history */}
          <Fold
            title="Equipment"
            icon={<Anchor className="w-5 h-5" />}
            defaultOpen
          >
            {lures.length === 0 ? (
              <p className="text-xs text-slate-400">
                Log a few {species} catches or connect live weather to get lure
                recommendations — no guesses here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lures.map((l, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold uppercase tracking-wide"
                  >
                    <Fish className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{l.name}</span>
                    {l.catches > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-mono font-black uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        {l.catches} catch{l.catches === 1 ? '' : 'es'}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </Fold>

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
            Something went wrong — try refreshing.
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
