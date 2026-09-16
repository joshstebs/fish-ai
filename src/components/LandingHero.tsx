import { ArrowRight, Camera, Fish, MapPin, Sparkles } from 'lucide-react';

export function LandingHero({ onOpenVision, onOpenReport }: { onOpenVision: () => void; onOpenReport: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card" style={{ boxShadow: 'var(--shadow-panel)' }}>
      {/* glow backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[100px]" />
        <div className="absolute -bottom-40 -right-24 h-72 w-96 rounded-full bg-teal-500/10 blur-[90px]" />
      </div>
      <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <Fish className="size-3.5" /> FishAI — Snap it. Know it. Fish smarter.
          </p>
          <h2 className="headline mt-4 text-5xl sm:text-6xl lg:text-7xl">
            Snap it.
            <br />
            Know it.
            <br />
            <span className="text-primary">Fish smarter.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Identify the fish — then get the next best move. Live conditions, personal patterns, better calls on the water.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onOpenVision}
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-95"
            >
              <Camera className="size-4" />
              Identify a fish
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={onOpenReport}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-xs font-bold uppercase tracking-widest transition-colors hover:border-primary hover:text-primary"
            >
              <MapPin className="size-4" />
              Today's bite
            </button>
          </div>
          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
            {[
              ['13', 'integrated modules'],
              ['Live', 'weather + solunar'],
              ['Private', 'logbook by default'],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-xl font-bold leading-none">{v}</dd>
                <dd className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* vision shortcut card — mirrors lovable's catch-photo panel */}
        <button
          type="button"
          onClick={onOpenVision}
          className="group relative overflow-hidden rounded-xl border border-dashed border-primary/40 bg-background/60 p-6 text-left transition-colors hover:border-primary"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Catch photo</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-3" /> Vision
            </span>
          </div>
          <div className="mt-5 flex flex-col items-center rounded-lg bg-secondary/60 px-4 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Camera className="size-6" />
            </span>
            <span className="mt-3 text-sm font-semibold">Drop a fish photo to start</span>
            <span className="mt-1 text-xs text-muted-foreground">Upload, paste (Ctrl/⌘ V) or shoot — ID + size in seconds</span>
          </div>
          <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all group-hover:brightness-110">
            Open Vision <ArrowRight className="size-3.5" />
          </span>
        </button>
      </div>
    </section>
  );
}
