import React from 'react';
import { CatchLogItem } from '../types/catchLogTypes';
import { analyzeCatches } from '../utils/insights';
import { exportCatchesToCSV } from '../utils/storage';
import {
  Brain,
  Sparkles,
  BookOpen,
  Fish,
  Clock,
  Anchor,
  Target,
  Trophy,
  MapPin,
  Calendar,
  Scale,
  Ruler,
  Download,
  ShieldCheck,
} from 'lucide-react';

interface InsightsViewProps {
  catches: CatchLogItem[];
}

const CONFIDENCE_STYLES: Record<'HIGH' | 'MEDIUM' | 'LOW', string> = {
  HIGH: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  LOW: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

function fmtLbs(n: number): string {
  return `${Number.isInteger(n) ? n : n.toFixed(1)} lbs`;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ catches }) => {
  const report = analyzeCatches(catches);

  const maxCount = report.speciesStats.reduce((max, s) => Math.max(max, s.count), 0);

  // personalBests already sorted biggest-first by analyzeCatches; sort defensively anyway
  const personalBests = [...report.personalBests].sort((a, b) => b.weightLbs - a.weightLbs);

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-slate-900 border-l-4 border-cyan-400 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-3 py-1 bg-cyan-600 text-white font-black text-xs uppercase tracking-widest rounded inline-flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" /> Insights
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Pattern AI
            </span>
          </div>
          <h2 className="font-display text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            Your Fishing Intelligence
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Every catch teaches FishAI your patterns — best hours, lures, and spots.
          </p>
        </div>

        {catches.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportCatchesToCSV(catches)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {catches.length === 0 ? (
        /* Empty State — no data, no fabricated insights */
        <div className="bg-slate-900 border border-white/10 rounded-xl p-12 text-center space-y-4 shadow-xl">
          <Brain className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-black uppercase tracking-wider text-white">
            No Patterns Yet
          </h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Log a catch to start learning your patterns — best hours, top lures, and spots.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Total Catches
              </span>
              <span className="text-2xl font-black text-white font-mono">{report.totalCatches}</span>
            </div>

            <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Fish className="w-3.5 h-3.5 text-emerald-400" /> Species Tracked
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{report.speciesCount}</span>
            </div>

            <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Best Hour Window
              </span>
              <span className="text-lg font-black text-cyan-400 font-mono truncate block">
                {report.bestHourRange}
              </span>
            </div>

            <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Anchor className="w-3.5 h-3.5 text-amber-400" /> Top Lure
              </span>
              {report.bestLure ? (
                <>
                  <span className="text-sm font-black text-amber-400 truncate block">{report.bestLure.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    {report.bestLure.catches} catch{report.bestLure.catches === 1 ? '' : 'es'}
                  </span>
                </>
              ) : (
                <span className="text-base font-black text-slate-500 font-mono block">—</span>
              )}
            </div>
          </div>

          {/* Patterns Found */}
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" /> Patterns Found
            </h3>
            {report.patterns.length === 0 ? (
              <p className="text-slate-400 text-xs font-mono">
                Not enough data for pattern detection yet — keep logging catches and patterns will
                start to emerge.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.patterns.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl leading-none">{p.emoji}</span>
                        <h4 className="text-sm font-black text-white uppercase tracking-wide">
                          {p.title}
                        </h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border ${CONFIDENCE_STYLES[p.confidence]}`}
                      >
                        {p.confidence}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono leading-relaxed">{p.detail}</p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                      Based on {p.sampleSize} catch{p.sampleSize === 1 ? '' : 'es'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Species Breakdown */}
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Fish className="w-4 h-4 text-emerald-400" /> Species Breakdown
            </h3>
            <div className="space-y-4">
              {report.speciesStats.map((s) => {
                const pct = maxCount > 0 ? Math.round((s.count / maxCount) * 100) : 0;
                return (
                  <div key={s.commonName} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-black text-white uppercase tracking-wide truncate">
                        {s.commonName}
                      </h4>
                      <span className="text-xs font-black text-cyan-400 font-mono">{s.count}</span>
                    </div>

                    {/* CSS horizontal bar proportional to count / maxCount */}
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Scale className="w-3 h-3 text-amber-400" /> Avg Weight
                        </span>
                        <span className="font-black text-white block truncate">
                          {s.avgWeightLbs !== null ? fmtLbs(s.avgWeightLbs) : '—'}
                        </span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-emerald-400" /> Biggest
                        </span>
                        <span className="font-black text-emerald-400 block truncate">
                          {s.biggestWeightLbs !== null ? fmtLbs(s.biggestWeightLbs) : '—'}
                        </span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Ruler className="w-3 h-3 text-blue-400" /> Longest
                        </span>
                        <span className="font-black text-white block truncate">
                          {s.longestInches !== null ? `${s.longestInches} in` : '—'}
                        </span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Anchor className="w-3 h-3 text-cyan-400" /> Top Bait
                        </span>
                        <span className="font-black text-white block truncate">{s.topBait || '—'}</span>
                      </div>
                    </div>

                    {s.topSpot && (
                      <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="truncate font-bold text-xs">Top spot: {s.topSpot}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Personal Bests */}
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Personal Bests
            </h3>
            {personalBests.length === 0 ? (
              <p className="text-slate-400 text-xs font-mono">
                No weight data logged yet — add estimated weights to track your personal bests.
              </p>
            ) : (
              <div className="space-y-3">
                {personalBests.map((pb, i) => (
                  <div
                    key={`${pb.commonName}-${pb.catch.id}`}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg font-black text-slate-500 font-mono w-6 shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-white uppercase tracking-wide truncate">
                          {pb.commonName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          {pb.catch.locationName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-red-400" /> {pb.catch.locationName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-cyan-400" /> {pb.catch.formattedDate}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-base font-black text-amber-400 font-mono shrink-0">
                      {fmtLbs(pb.weightLbs)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Honesty Footer */}
      <div className="bg-slate-900 border border-white/10 rounded-xl p-4 flex items-start gap-2.5 shadow-xl">
        <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-[11px] font-mono text-slate-500 leading-relaxed">
          Insights are based only on your logged data — small samples are marked low confidence.
        </p>
      </div>
    </div>
  );
};
