import React, { useEffect, useState, useCallback } from 'react';
import { Moon, Sun, Clock, Compass, Sparkles, Calendar, AlertTriangle, MapPin } from 'lucide-react';
import { FishingSpot } from '../types/catchLogTypes';
import { getMoonInfo, getSunTimes, getSolunarPeriods, formatTime } from '../utils/solunar';
import { resolveWeatherCoords } from '../utils/weather';

interface SolunarActivityViewProps {
  spots?: FishingSpot[];
}

export const SolunarActivityView: React.FC<SolunarActivityViewProps> = ({ spots = [] }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [coordsNote, setCoordsNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await resolveWeatherCoords(spots);
      if (!cancelled) {
        if (c) {
          setCoords(c);
        } else {
          setCoordsNote('No location available. Add a spot with coordinates or allow browser location for sunrise/solunar times. Moon phase is shown below regardless.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spots]);

  const date = new Date(selectedDate + 'T12:00:00');
  const moonInfo = getMoonInfo(date);
  const sun = coords ? getSunTimes(date, coords.latitude, coords.longitude) : null;
  const solunar = coords ? getSolunarPeriods(date, coords.latitude, coords.longitude) : [];

  const nextFull = new Date(moonInfo.nextFullMoon);
  const nextNew = new Date(moonInfo.nextNewMoon);
  const daysToFull = Math.round((nextFull.getTime() - date.getTime()) / 86400000);
  const daysToNew = Math.round((nextNew.getTime() - date.getTime()) / 86400000);
  const strongMoon = moonInfo.illuminationPct >= 85 || moonInfo.illuminationPct <= 10;

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="tool-heading flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-purple-600 text-white font-black text-xs uppercase tracking-widest rounded">
              FishAI Solunar Engine
            </span>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
              <Moon className="w-3.5 h-3.5" /> Astronomical Calculation
            </span>
          </div>
          <h2 className="text-2xl font-display font-black uppercase text-white tracking-tight flex items-center gap-2">
            🌙 Solunar Peak Feeding & Moon Phase Calculator
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Real astronomical calculations: moon phase, sunrise/sunset, and solunar major/minor feeding windows. Computed from actual orbital math for your date and location.
          </p>
        </div>

        {/* Date Picker */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2 shrink-0">
          <Calendar className="w-4 h-4 text-purple-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {coordsNote && !coords && (
        <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-xl text-amber-200 text-xs font-mono flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{coordsNote}</span>
        </div>
      )}

      {/* Main Solunar Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Moon Phase Card */}
        <div className="bg-slate-900 border border-white/10 p-5 rounded-xl space-y-3 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-[10px] font-black uppercase text-purple-400 font-mono">Moon Phase</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{moonInfo.illuminationPct}% Illuminated</span>
          </div>

          <div className="text-center py-2 space-y-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-950 via-slate-800 to-amber-200 border-2 border-purple-400/50 mx-auto shadow-2xl flex items-center justify-center">
              <Moon className="w-8 h-8 text-amber-200" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{moonInfo.phaseName}</h3>
            <span className="text-xs text-slate-400 font-mono block">
              {moonInfo.ageDays} days old {strongMoon ? '• strong gravitational influence' : ''}
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300">
            {daysToFull >= 0 && daysToFull <= 14
              ? `Full moon in ~${daysToFull} day${daysToFull === 1 ? '' : 's'}. Nighttime feeding activity often spikes around full moons.`
              : `New moon in ~${daysToNew} day${daysToNew === 1 ? '' : 's'}. Dark nights; low-light predators are more active.`}
          </div>
        </div>

        {/* Daily Bite Index Gauge */}
        <div className="bg-slate-900 border border-white/10 p-5 rounded-xl space-y-3 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-[10px] font-black uppercase text-emerald-400 font-mono">Solunar Activity</span>
            <span className="text-xs font-mono font-bold text-amber-400">{coords ? 'Computed for your location' : 'Location needed'}</span>
          </div>

          <div className="text-center py-2 space-y-1">
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 font-mono">
              {solunar.length ? `${Math.max(...solunar.filter((p) => p.type === 'MAJOR').map((p) => (p.rating === 'VERY HIGH' ? 90 : 75)), solunar.some((p) => p.type === 'MINOR') ? 60 : 50)}%` : '—'}
            </span>
            <span className="text-xs font-black uppercase text-emerald-400 block tracking-widest">
              {solunar.some((p) => p.type === 'MAJOR') ? `${solunar.filter((p) => p.type === 'MAJOR').length} major window${solunar.filter((p) => p.type === 'MAJOR').length > 1 ? 's' : ''} today` : 'Waiting for location'}
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300">
            Solunar periods mark moon overhead/underfoot (major) and moonrise/set (minor). Classic peak-feeding times used by anglers worldwide.
          </div>
        </div>

        {/* Sunrise / Sunset Astronomical Times */}
        <div className="bg-slate-900 border border-white/10 p-5 rounded-xl space-y-3 shadow-xl flex flex-col justify-between font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-[10px] font-black uppercase text-amber-400 font-mono">Solar Transits</span>
            <span className="text-[10px] text-slate-400">Local Time</span>
          </div>

          {sun ? (
            <div className="space-y-2">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Sun className="w-4 h-4" /> Sunrise
                </span>
                <span className="font-black text-white">{formatTime(sun.sunrise)}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-500 font-bold">
                  <Sun className="w-4 h-4" /> Sunset
                </span>
                <span className="font-black text-white">{formatTime(sun.sunset)}</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] text-slate-400">
              Sunrise/sunset need coordinates. {coords ? 'Unavailable for this latitude' : 'Allow location or add a spot.'}
            </div>
          )}

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-slate-400">
            Low-light windows (30 min before sunrise / after sunset) are prime feeding times.
          </div>
        </div>
      </div>

      {/* Solunar Feeding Windows Timeline */}
      {coords && (
        <div className="bg-slate-900 border border-white/10 p-6 rounded-xl space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" /> Solunar Feeding Periods ({selectedDate})
            </h3>
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {coords.latitude.toFixed(2)}°, {coords.longitude.toFixed(2)}°
            </span>
          </div>

          {solunar.length === 0 ? (
            <p className="text-xs font-mono text-slate-400">No solunar periods computable for this date.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {solunar.map((period, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-2 transition-all ${
                    period.type === 'MAJOR'
                      ? 'bg-slate-950 border-purple-500/50 ring-1 ring-purple-500/30'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${
                      period.type === 'MAJOR' ? 'bg-purple-500 text-slate-950' : 'bg-blue-600 text-white'
                    }`}>
                      {period.type} PERIOD
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{period.rating}</span>
                  </div>
                  <h4 className="text-lg font-black text-white font-mono">
                    {formatTime(period.start)} – {formatTime(period.end)}
                  </h4>
                  <p className="text-xs font-mono text-slate-300 leading-relaxed font-sans">{period.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-slate-500 font-mono">
        <Sparkles className="w-3 h-3 inline text-purple-400 mr-1" />
        All values computed from orbital mechanics for the selected date (no stored or fabricated data). Solunar theory is a tradition, not a guarantee; use it as a tie-breaker, not gospel.
      </p>
    </div>
  );
};

