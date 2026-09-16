import { CalendarCheck2, LineChart, NotebookPen, Radar } from 'lucide-react';

const STEPS = [
  { icon: NotebookPen, n: '1', t: 'Catch log', d: 'You log it. Photo, weight, length, spot — in seconds.' },
  { icon: Radar, n: '2', t: 'Conditions', d: 'We track it. Weather, water temp, pressure and moon at that moment.' },
  { icon: LineChart, n: '3', t: 'Insight', d: 'We analyze it. Your patterns surface — best hours, lures, spots.' },
  { icon: CalendarCheck2, n: '4', t: 'Next move', d: 'You catch more. Fish your best window, not a guess.' },
];

export function HowItWorks({ onOpenLogbook }: { onOpenLogbook: () => void }) {
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Learning loop</p>
          <h2 className="headline mt-2 text-3xl sm:text-4xl">The more you fish, the better it knows.</h2>
        </div>
        <button
          type="button"
          onClick={onOpenLogbook}
          className="rounded-lg border border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors hover:border-primary hover:text-primary"
        >
          Open logbook
        </button>
      </div>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <li key={s.n} className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-panel)' }}>
            <div className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <s.icon className="size-4.5" />
              </span>
              <span className="font-display text-2xl font-bold text-muted-foreground/50">{s.n}</span>
            </div>
            <div className="mt-3 text-sm font-semibold">{s.t}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ModulesStrip() {
  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-2 rounded-xl border border-border bg-card px-5 py-4 text-center sm:flex-row sm:text-left">
      <p className="text-xs font-semibold uppercase tracking-widest">
        <span className="text-primary">FishAI</span>{' '}
        <span className="text-muted-foreground">13 integrated fishing modules · real weather, solunar math &amp; a personal learning loop</span>
      </p>
    </div>
  );
}
