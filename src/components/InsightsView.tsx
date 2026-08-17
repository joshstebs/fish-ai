import React from 'react';
import { CatchLogItem } from '../types/catchLogTypes';
import { analyzeCatches, speciesOf, parseLengthInches } from '../utils/insights';
import { exportCatchesToCSV } from '../utils/storage';
import {
  Brain,
  Sparkles,
  BookOpen,
  Fish,
  Clock,
  Anchor,
  Activity,
  Target,
  Trophy,
  MapPin,
  Calendar,
  CalendarX,
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

// ============================================================================
// Bite Confidence Over Time — SVG area/line chart of REAL per-day catch counts
// (the honest 'activity over time' the Learning Loop poster implies). Built
// only from the catches prop: group by calendar day, plot catch counts.
// ============================================================================

const TREND_MAX_DAYS = 7; // most recent N log days plotted (matches poster's "7 Days" filter)
const CHART_W = 560;
const CHART_H = 180;
const CHART_PAD_LEFT = 30;
const CHART_PAD_RIGHT = 10;
const CHART_PAD_TOP = 14;
const CHART_PAD_BOTTOM = 24;

interface DayCount {
  key: string; // YYYY-MM-DD local day
  label: string; // e.g. "May 8"
  count: number; // real catches logged that day
}

/** Group catches by calendar day (from the ISO `timestamp` field). Days with an
 *  unparseable/empty timestamp are skipped honestly — never guessed. Returns the
 *  most recent TREND_MAX_DAYS days present, oldest → newest. */
function buildPerDaySeries(catches: CatchLogItem[]): DayCount[] {
  const byDay = new Map<string, { label: string; count: number }>();
  for (const c of catches) {
    const d = new Date(c.timestamp);
    if (Number.isNaN(d.getTime())) continue; // no usable date — leave out rather than fabricate
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = byDay.get(key);
    if (existing) existing.count += 1;
    else byDay.set(key, { label, count: 1 });
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({ key, ...v }))
    .slice(-TREND_MAX_DAYS);
}

/** SVG area/line chart per the Learning Loop poster recipe: teal #27bd98 stroke
 *  (2.5, round caps), vertical linearGradient area fill (0.4 opacity → 0), hollow
 *  slate-950 points with a #27bd98 ring, faint gridlines, #5c646c axis labels. */
const BiteConfidenceChart: React.FC<{ series: DayCount[] }> = ({ series }) => {
  const n = series.length;
  const maxCount = Math.max(...series.map((d) => d.count), 1);
  const yMax = Math.max(1, Math.ceil(maxCount / 2) * 2); // smallest even ceiling ≥ max

  const innerW = CHART_W - CHART_PAD_LEFT - CHART_PAD_RIGHT;
  const innerH = CHART_H - CHART_PAD_TOP - CHART_PAD_BOTTOM;
  const baseY = CHART_PAD_TOP + innerH;

  const xFor = (i: number) =>
    n === 1 ? CHART_PAD_LEFT + innerW / 2 : CHART_PAD_LEFT + (i / (n - 1)) * innerW;
  const yFor = (count: number) => CHART_PAD_TOP + (1 - count / yMax) * innerH;

  const points = series.map((d, i) => ({ x: xFor(i), y: yFor(d.count), ...d }));

  // integer ticks along the 0..100% steps — deduped, so small logs keep minimal gridlines
  const ticks = Array.from(new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f))));

  const linePath =
    n > 1
      ? points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
      : '';
  const areaPath =
    n > 1
      ? `M${points[0].x.toFixed(1)} ${baseY} L` +
        points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L') +
        ` L${points[n - 1].x.toFixed(1)} ${baseY} Z`
      : '';

  return (
    <div className="rounded-lg border border-white/5 bg-slate-950/60 p-4">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Bite confidence over time — catches per day from your log"
      >
        <defs>
          <linearGradient id="fishai-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#27bd98" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#27bd98" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* faint horizontal gridlines + count tick labels */}
        {ticks.map((t) => {
          const y = yFor(t);
          return (
            <g key={t}>
              <line
                x1={CHART_PAD_LEFT}
                x2={CHART_W - CHART_PAD_RIGHT}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
              />
              <text
                x={CHART_PAD_LEFT - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#5c646c"
                fontFamily="monospace"
              >
                {t}
              </text>
            </g>
          );
        })}

        {/* gradient area fill, then the teal line */}
        {areaPath && <path d={areaPath} fill="url(#fishai-area-fill)" />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#27bd98"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* hollow points — one per logged day */}
        {points.map((p) => (
          <circle key={p.key} cx={p.x} cy={p.y} r={3.5} fill="#090e12" stroke="#27bd98" strokeWidth={2} />
        ))}

        {/* date axis labels */}
        {points.map((p) => (
          <text
            key={`x-${p.key}`}
            x={p.x}
            y={CHART_H - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#5c646c"
          >
            {p.label}
          </text>
        ))}
      </svg>

      <div className="mt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500">
        <span>CATCHES PER DAY</span>
        <span>
          {n} day{n === 1 ? '' : 's'} · peak {maxCount}
        </span>
      </div>
    </div>
  );
};

export const InsightsView: React.FC<InsightsViewProps> = ({ catches }) => {
  const report = analyzeCatches(catches);

  const maxCount = report.speciesStats.reduce((max, s) => Math.max(max, s.count), 0);

  // personalBests already sorted biggest-first by analyzeCatches; sort defensively anyway
  const personalBests = [...report.personalBests].sort((a, b) => b.weightLbs - a.weightLbs);

  // --- 'My Catches' stats — every number derived from the REAL catches prop ---
  const speciesCounts = new Map<string, number>();
  const spots = new Set<string>();
  for (const c of catches) {
    const s = speciesOf(c);
    speciesCounts.set(s, (speciesCounts.get(s) || 0) + 1);
    if (c.locationName) spots.add(c.locationName);
  }
  const topSpeciesEntry = [...speciesCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topSpecies = topSpeciesEntry ? topSpeciesEntry[0] : null;
  const topSpeciesCount = topSpeciesEntry ? topSpeciesEntry[1] : 0;
  const totalSpots = spots.size;

  // Biggest by weight first; fall back to longest by inches (also real data) and
  // an honest empty state when the log has no size info at all.
  const biggest = personalBests[0] ?? null;
  const longest =
    catches
      .map((c) => ({ c, len: parseLengthInches(c.estimatedLength) }))
      .filter((x): x is { c: CatchLogItem; len: number } => x.len !== null)
      .sort((a, b) => b.len - a.len)[0] ?? null;

  const daySeries = buildPerDaySeries(catches);
  const peakDayCount = daySeries.reduce((m, d) => Math.max(m, d.count), 0);

  return (
    <div className="space-y-6 font-sans text-slate-900">
      <div className="bg-slate-900 border-l-4 border-violet-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-1 bg-violet-600 text-white font-black text-xs uppercase tracking-widest rounded inline-flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" /> Insights
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Learning Loop
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-tight leading-tight">
            Every Catch Teaches FishAI
          </h2>
          <p className="text-slate-400 text-sm mt-1.5 font-mono uppercase tracking-wider">
            Log trips. Learn patterns. Get smarter recommendations.
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
          {/* My Catches — stat strip from the REAL catch log */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-violet-400" /> My Catches
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Total Catches
                </span>
                <span className="text-2xl font-black text-white font-mono">{report.totalCatches}</span>
              </div>

              <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Fish className="w-3.5 h-3.5 text-emerald-400" /> Top Species
                </span>
                {topSpecies ? (
                  <>
                    <span className="text-lg font-black text-white font-mono uppercase truncate block">
                      {topSpecies}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      {topSpeciesCount} catch{topSpeciesCount === 1 ? '' : 'es'} · {report.speciesCount} species
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-black text-slate-500 font-mono block">—</span>
                )}
              </div>

              <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> Biggest
                </span>
                {biggest ? (
                  <>
                    <span className="text-2xl font-black text-amber-400 font-mono block">
                      {fmtLbs(biggest.weightLbs)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider truncate block">
                      {biggest.commonName}
                    </span>
                  </>
                ) : longest ? (
                  <>
                    <span className="text-2xl font-black text-white font-mono block">
                      {Number.isInteger(longest.len) ? longest.len : longest.len.toFixed(1)} in
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider truncate block">
                      {longest.c.commonName} · longest
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-black text-slate-500 font-mono block">—</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">no size data</span>
                  </>
                )}
              </div>

              <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" /> Total Spots
                </span>
                <span className="text-2xl font-black text-white font-mono">{totalSpots}</span>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  {totalSpots === 1 ? 'unique spot' : 'unique spots'}
                </span>
              </div>
            </div>
          </section>

          {/* Best window + top lure — labeled cards with honest empty states */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Best Bite Window
              </span>
              {report.bestHourRange !== '—' ? (
                <>
                  <span className="text-2xl font-black text-cyan-400 font-mono uppercase block truncate">
                    {report.bestHourRange}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Most productive 2-hour block in your log
                  </span>
                </>
              ) : (
                <span className="text-base font-black text-slate-500 font-mono block">
                  Not enough data yet — log trips with times.
                </span>
              )}
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5 text-amber-400" /> Top Lure
              </span>
              {report.bestLure ? (
                <>
                  <span className="text-xl font-black text-amber-400 font-mono uppercase truncate block">
                    {report.bestLure.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    {report.bestLure.catches} catch{report.bestLure.catches === 1 ? '' : 'es'} on this presentation
                  </span>
                </>
              ) : (
                <span className="text-base font-black text-slate-500 font-mono block">
                  No lure data yet — log bait on your next catch.
                </span>
              )}
            </div>
          </section>

          {/* Bite Confidence Over Time — real per-day catch counts, honest empty state */}
            <div className="bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" /> Bite Confidence Over Time
                  </span>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider truncate">
                    Real catches per day across your last {daySeries.length || TREND_MAX_DAYS} logged day
                    {daySeries.length === 1 ? '' : 's'}
                  </p>
                </div>
                {daySeries.length > 0 && (
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black text-emerald-400 font-mono block leading-none">
                      {peakDayCount}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      peak day
                    </span>
                  </div>
                )}
              </div>

              {daySeries.length === 0 ? (
                /* Honest empty state — no usable catch dates, so no chart */
                <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/60 p-8 text-center space-y-2">
                  <CalendarX className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-black uppercase tracking-wider text-slate-300">
                    No catch dates yet
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 max-w-sm mx-auto">
                    Log a catch and your bite-frequency area chart — how many bites you log per day —
                    will appear here.
                  </p>
                </div>
              ) : (
                <BiteConfidenceChart series={daySeries} />
              )}
            </div>
          </section>

          {/* Patterns Found */}
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
