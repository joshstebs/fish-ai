import React, { useEffect, useState, useCallback } from 'react';
import { TrendingDown, TrendingUp, Minus, AlertTriangle, Sparkles, Zap, ShieldCheck, Compass, MapPin, RefreshCw, CloudSun } from 'lucide-react';
import { FishingSpot, LiveWeather } from '../types/catchLogTypes';
import { fetchLiveWeather, resolveWeatherCoords, weatherCodeToCondition } from '../utils/weather';

interface PressureTrendState {
  trend: 'RAPID_DROP' | 'STEADY' | 'RISING';
  biteForecast: 'FEEDING FRENZY' | 'NORMAL BITE' | 'SLUGGISH BOTTOM BITE';
  lureSpeedAdvice: string;
  depthAdvice: string;
}

// Educational reference — what each pressure trend MEANS for fishing.
// This is general knowledge, clearly labeled — never presented as live data.
const TREND_REFERENCE: Record<string, PressureTrendState> = {
  RAPID_DROP: {
    trend: 'RAPID_DROP',
    biteForecast: 'FEEDING FRENZY',
    lureSpeedAdvice: 'Fast & aggressive presentations: crankbaits, spinnerbaits, and topwaters at higher speeds.',
    depthAdvice: 'Fish often move up aggressively to shallow weedlines (2-6 ft) to feed before an incoming storm front.',
  },
  STEADY: {
    trend: 'STEADY',
    biteForecast: 'NORMAL BITE',
    lureSpeedAdvice: 'Moderate retrieve with steady rhythm. Standard Texas rigs, Senkos, and swimbaits.',
    depthAdvice: 'Fish hold steady at mid-depth structure (6-12 ft dropoffs).',
  },
  RISING: {
    trend: 'RISING',
    biteForecast: 'SLUGGISH BOTTOM BITE',
    lureSpeedAdvice: 'Slow down! Dead-stick finesse drop-shot rigs, jigs, and small live minnows.',
    depthAdvice: 'Post-front high pressure often pushes fish deep into heavy cover (12-20 ft).',
  },
};

interface BarometricTrackerViewProps {
  spots?: FishingSpot[];
}

export const BarometricTrackerView: React.FC<BarometricTrackerViewProps> = ({ spots = [] }) => {
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('');

  const loadWeather = useCallback(async () => {
    setLoading(true);
    setWeatherError(null);
    const coords = await resolveWeatherCoords(spots);
    if (!coords) {
      setWeatherError('Location unavailable. Allow browser location access or add a fishing spot with coordinates, then refresh.');
      setLoading(false);
      return;
    }
    setLocationLabel(`${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°`);
    const w = await fetchLiveWeather(coords.latitude, coords.longitude);
    if (!w) {
      setWeatherError('Live weather service unreachable. Check your connection and refresh.');
    } else {
      setWeather(w);
    }
    setLoading(false);
  }, [spots]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  // Map the real trend to the reference card
  const activeTrend: 'RAPID_DROP' | 'STEADY' | 'RISING' = !weather
    ? 'STEADY'
    : weather.pressureTrend === 'FALLING'
    ? 'RAPID_DROP'
    : weather.pressureTrend === 'RISING'
    ? 'RISING'
    : 'STEADY';

  const reference = TREND_REFERENCE[activeTrend];

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-slate-900 border-l-4 border-cyan-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-cyan-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded">
              FishAI Pressure Predictor
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
              <CloudSun className="w-3.5 h-3.5" /> Live Weather Powered
            </span>
          </div>
          <h2 className="text-2xl font-display font-black uppercase text-white tracking-tight flex items-center gap-2">
            📉 Barometric Pressure Trend & Bite Predictor
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Live barometric pressure from Open-Meteo for your location. Fish swim bladders are sensitive to pressure changes — falling pressure often triggers feeding frenzies before cold fronts.
          </p>
        </div>
        <button
          onClick={loadWeather}
          disabled={loading}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-700 flex items-center gap-2 transition-all shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Weather unavailable */}
      {weatherError && (
        <div className="bg-amber-950/40 border border-amber-500/30 p-5 rounded-xl text-amber-200 text-xs font-mono flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-bold">{weatherError}</p>
            <p className="text-amber-300/70">No pressure data is shown rather than fake data. The reference cards below still explain each trend.</p>
          </div>
        </div>
      )}

      {loading && !weather && !weatherError && (
        <div className="bg-slate-900 border border-white/10 rounded-xl p-10 text-center space-y-3 shadow-xl">
          <RefreshCw className="w-8 h-8 text-cyan-400 mx-auto animate-spin" />
          <p className="text-xs font-mono text-slate-400">Fetching live weather for {locationLabel || 'your location'}...</p>
        </div>
      )}

      {weather && (
        <>
          {/* Live Conditions Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" /> Current Pressure
              </span>
              <span className="text-2xl font-black text-white font-mono">{weather.current.pressureInHg} inHg</span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {weather.pressureDelta6h >= 0 ? '+' : ''}{weather.pressureDelta6h.toFixed(2)} inHg / 6h
              </span>
            </div>

            <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-cyan-400" /> Trend
              </span>
              <span className={`text-xl font-black uppercase font-mono ${
                activeTrend === 'RAPID_DROP' ? 'text-red-400' : activeTrend === 'RISING' ? 'text-blue-400' : 'text-emerald-400'
              }`}>
                {weather.pressureTrend}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">last 6 hours (live)</span>
            </div>

            <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <CloudSun className="w-3.5 h-3.5 text-amber-400" /> Conditions
              </span>
              <span className="text-lg font-black text-white font-mono">{weather.current.temperatureF}°F</span>
              <span className="text-[10px] text-slate-400 font-mono block">{weather.current.condition} • wind {weather.current.windSpeedMph} mph {weather.current.windDirection}</span>
            </div>

            <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Location
              </span>
              <span className="text-lg font-black text-white font-mono">{locationLabel}</span>
              <span className="text-[10px] text-slate-400 font-mono block">fetched {new Date(weather.fetchedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Live bite forecast (general knowledge applied to REAL trend) */}
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                  Bite Forecast (based on live trend)
                </span>
                <h3 className="text-xl font-black text-white font-mono">
                  {reference.biteForecast}
                </h3>
              </div>
              <span className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg border font-mono ${
                activeTrend === 'RAPID_DROP'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                  : activeTrend === 'STEADY'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}>
                LIVE: {weather.pressureTrend} PRESSURE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Recommended Lure Speed & Action:
                </span>
                <p className="text-slate-200 leading-relaxed font-sans">{reference.lureSpeedAdvice}</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" /> Recommended Water Depth Zone:
                </span>
                <p className="text-slate-200 leading-relaxed font-sans">{reference.depthAdvice}</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Pressure reading is live. Lure/depth advice is general fishing knowledge — your personal patterns live in the Insights tab.
            </p>
          </div>
        </>
      )}

      {/* Educational Reference Cards (always visible, labeled as reference) */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" /> Pressure Trend Reference Guide (educational — not live data)
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {(['RAPID_DROP', 'STEADY', 'RISING'] as const).map((t) => {
            const cfg = TREND_REFERENCE[t];
            const isActive = t === activeTrend && !!weather;
            return (
              <div
                key={t}
                className={`p-4 rounded-xl border text-center transition-all ${
                  isActive
                    ? t === 'RAPID_DROP'
                      ? 'bg-red-950/60 border-red-500 ring-2 ring-red-500/30'
                      : t === 'STEADY'
                      ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-slate-900 border-slate-800 opacity-80'
                }`}
              >
                {t === 'RAPID_DROP' ? (
                  <TrendingDown className="w-6 h-6 text-red-400 mx-auto mb-1" />
                ) : t === 'STEADY' ? (
                  <Minus className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                ) : (
                  <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                )}
                <span className={`text-xs font-black uppercase tracking-wider block ${
                  t === 'RAPID_DROP' ? 'text-red-300' : t === 'STEADY' ? 'text-emerald-300' : 'text-blue-300'
                }`}>
                  {t === 'RAPID_DROP' ? 'Falling Pressure' : t === 'STEADY' ? 'Steady Pressure' : 'Rising Pressure'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">{cfg.biteForecast}</span>
                {isActive && (
                  <span className="text-[9px] font-black uppercase text-white bg-emerald-500/20 border border-emerald-500/40 rounded px-1.5 py-0.5 inline-block mt-2 font-mono">
                    ● Your live trend
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
