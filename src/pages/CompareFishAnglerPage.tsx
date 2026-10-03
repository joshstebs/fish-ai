import React from 'react';

export function CompareFishAnglerPage({ onStart }: { onStart?: () => void } = {}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">FishAI and FishAngler: different product focus</h1>
      <p className="mt-3 text-slate-300 text-sm sm:text-base">
        Competitor capabilities change. This page documents FishAI's own current behavior rather than making unsupported claims about another app.
      </p>
      <div className="mt-6 grid gap-3">
        {[
          ['Personal logbook', 'Recorded catches and derived insights are local-first.'],
          ['Weather and pressure', 'Live data is fetched from Open-Meteo when requested.'],
          ['Saved spots', 'Exact coordinates are kept in browser storage, while network features may transmit coordinates to service providers.'],
          ['AI vision', 'Optional paid analysis uses configured third-party vision providers and never supplies a regulation verdict.'],
        ].map(([title, detail]) => (
          <div key={title} className="bg-slate-900 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-400">{title}</div>
            <div className="mt-1 text-sm text-slate-300">{detail}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-500">For FishAngler's current feature set and pricing, use FishAngler's own current product information.</p>
      {onStart && <button onClick={onStart} className="mt-5 px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider">Open FishAI</button>}
    </div>
  );
}
