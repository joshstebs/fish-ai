const STEPS = [
  { n: '1', kicker: 'Catch log', title: 'You log it.', body: 'Photo, weight, length, spot — in seconds.' },
  { n: '2', kicker: 'Conditions', title: 'We track it.', body: 'Weather, water temp, pressure and moon at that moment.' },
  { n: '3', kicker: 'Insight', title: 'We analyze it.', body: 'Bass are 2.4x more active in similar conditions.' },
  { n: '4', kicker: 'Next move', title: 'You catch more.', body: 'Best next window: 10:20 AM – 11:50 AM today.' },
];

export function LearningLoop() {
  return (
    <section id="learning-loop" className="mt-16 animate-in">
      <h2 className="headline max-w-2xl text-3xl sm:text-5xl">The more you fish, the better it knows.</h2>
      <p className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
        Your history becomes better decisions. Log trips, learn patterns, get smarter recommendations.
      </p>
      <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <li key={s.n} className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-panel)' }}>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-primary">{s.n}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{s.kicker}</span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-foreground">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
