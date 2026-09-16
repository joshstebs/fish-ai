export function LandingHero({ onSnap }: { onSnap: () => void }) {
  return (
    <section className="mb-10 animate-in">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">FishAI — Snap It. Know It. Fish Smarter.</p>
      <h2 className="headline mt-4 max-w-3xl text-5xl sm:text-7xl">
        Snap it. Know it.
        <span className="block text-primary">Fish smarter.</span>
      </h2>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        Identify the fish — then get the next best move. Live conditions, personal patterns, better calls on the water.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSnap}
          className="rounded-lg bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-lg hover:brightness-110"
        >
          Open Vision
        </button>
        <a
          href="#learning-loop"
          className="rounded-lg border border-border px-5 py-3 text-xs font-semibold uppercase tracking-widest text-foreground hover:border-primary"
        >
          How it learns
        </a>
      </div>
    </section>
  );
}
