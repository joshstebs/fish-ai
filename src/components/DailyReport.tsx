// ============================================================================
// Daily fish report — carried over verbatim from the Lovable project
// (src/components/DailyReport.tsx). Only change: the TanStack useQuery + server
// function are replaced by the same-shaped real-data hook
// (src/utils/fishReportData.ts -> useFishReport). Markup is unchanged.
// ============================================================================
import { MapPin, RefreshCw, SlidersHorizontal } from 'lucide-react';
import lure from '../assets/lure.png';
import { useFishReport } from '../utils/fishReportData';
import type { AnglerProfile } from '../utils/profile';

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-border bg-card p-5 ${className}`} style={{ boxShadow: 'var(--shadow-panel)' }}>
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function ConfidenceRing({ score }: { score: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="size-28 -rotate-[135deg]" aria-hidden="true">
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-secondary)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${c * 0.75} ${c}`} />
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-primary)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(c * 0.75 * score) / 100} ${c}`} />
    </svg>
  );
}

function Sparkline({ series }: { series: number[] }) {
  if (series.length < 2) return null;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * 200},${52 - ((v - min) / span) * 44}`).join(' ');
  return (
    <svg viewBox="0 0 200 60" className="h-14 flex-1" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoadingPanels() {
  return (
    <div className="mt-10 grid gap-4 lg:grid-cols-2" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-card" />
      ))}
    </div>
  );
}

export function DailyReport({ profile, onEdit }: { profile: AnglerProfile; onEdit: () => void }) {
  const location = profile.location!;
  const { data, isPending, isError, error, refetch, isFetching } = useFishReport({
    location,
    species: profile.species,
    tackle: profile.tackle,
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Live weather powered</p>
          <h2 className="headline mt-3 text-4xl sm:text-5xl">Your daily fish report.</h2>
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            <span className="font-medium text-foreground">{location.label}</span>
            {data && <span>· {data.localTime} local · targeting {data.recommendation.species}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-colors hover:border-primary hover:text-primary"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-colors hover:border-primary hover:text-primary"
          >
            <SlidersHorizontal className="size-3.5" />
            Preferences
          </button>
        </div>
      </div>

      {isPending && <LoadingPanels />}

      {isError && (
        <div className="mt-10 rounded-xl border border-destructive/50 bg-card p-6">
          <p className="text-sm font-medium">We couldn't pull live conditions for this spot.</p>
          <p className="mt-1 text-sm text-muted-foreground">{(error as Error)?.message ?? 'Unknown error'}</p>
          <button type="button" onClick={() => refetch()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
            Try again
          </button>
        </div>
      )}

      {data && (
        <>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <Panel title="Today's Bite Confidence">
              <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <ConfidenceRing score={data.confidence.score} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-3xl font-bold leading-none">{data.confidence.score}%</span>
                    <span className="mt-1 text-[10px] uppercase tracking-widest text-primary">{data.confidence.label}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{data.confidence.summary}</p>
                  <ul className="mt-3 space-y-1">
                    {data.confidence.factors.map((f) => (
                      <li key={f.label} className="flex gap-2 text-xs">
                        <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${f.positive ? 'bg-primary' : 'bg-muted-foreground'}`} />
                        <span className="text-muted-foreground">
                          <span className="text-foreground">{f.label}:</span> {f.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>

            <Panel title="Live Weather">
              <div className="flex items-center gap-6">
                <div>
                  <div className="font-display text-5xl font-bold leading-none">{data.current.tempF}°</div>
                  <div className="mt-2 max-w-28 text-sm text-muted-foreground">{data.current.condition}</div>
                </div>
                <div className="flex-1">
                  <Row label="Wind" value={`${data.current.windDir} ${data.current.windMph} mph`} />
                  <Row label="Humidity" value={`${data.current.humidity}%`} />
                  <Row label="Dew point" value={`${data.current.dewPointF}°`} />
                  <Row label="Visibility" value={`${data.current.visibilityMi} mi`} />
                </div>
              </div>
            </Panel>

            <Panel title="Best Bite Window">
              <div className="flex h-20 items-end gap-1">
                {data.biteWindow.hours.map((h) => (
                  <div
                    key={h.time}
                    title={`${h.label} — ${h.score}%`}
                    className={`flex-1 rounded-sm ${h.isPeak ? 'bg-primary' : 'bg-secondary'}`}
                    style={{ height: `${Math.max(8, h.score)}%` }}
                  />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Major</div>
                  <div className="text-sm font-medium">{data.biteWindow.major}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Minor</div>
                  <div className="text-sm font-medium">{data.biteWindow.minor}</div>
                </div>
              </div>
            </Panel>

            <Panel title="Pressure Trend">
              <div className="flex items-center gap-6">
                <div>
                  <div className="font-display text-4xl font-bold leading-none">
                    {data.pressure.inHg.toFixed(2)}
                    <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">inHg</span>
                  </div>
                  <div className="mt-2 max-w-40 text-sm text-primary">{data.pressure.note}</div>
                </div>
                <Sparkline series={data.pressure.series} />
              </div>
            </Panel>
          </div>

          <div className="mt-4 grid gap-6 rounded-xl border border-border bg-card p-6 sm:grid-cols-[auto_1fr_1fr] sm:items-center" style={{ boxShadow: 'var(--shadow-panel)' }}>
            <img src={lure} alt={data.recommendation.lure} width={944} height={704} loading="lazy" className="w-40 justify-self-center" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Recommended approach · {data.recommendation.match}% match
              </div>
              <div className="mt-1 text-lg font-semibold">{data.recommendation.lure}</div>
              <div className="text-sm text-primary">{data.recommendation.color}</div>
              <div className="mt-2 text-xs text-muted-foreground">{data.recommendation.retrieve}</div>
            </div>
            <div>
              <p className="text-sm leading-relaxed text-muted-foreground">{data.recommendation.why}</p>
              {data.recommendation.alternates.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Backups: {data.recommendation.alternates.map((a) => `${a.lure} (${a.color}, ${a.match}%)`).join(' · ')}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
