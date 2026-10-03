import React from 'react';

export function CompareFishbrainPage({ onStart }: { onStart?: () => void } = {}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">FishAI and Fishbrain: different product focus</h1>
      <p className="mt-3 text-slate-300 text-sm sm:text-base">
        This page does not rank either product or freeze competitor features in time. FishAI's current focus is the personal workflow below.
      </p>
      <div className="mt-6 grid gap-3">
        {[
          ['Local-first catches', 'FishAI stores your catch log in browser storage by default.'],
          ['Conditions', 'FishAI requests live Open-Meteo weather for the coordinates you choose.'],
          ['Solunar', 'FishAI computes astronomy-derived timing from the selected location and date.'],
          ['AI image analysis', 'FishAI can submit your uploaded photo to a configured vision provider and surfaces uncertainty.'],
        ].map(([title, detail]) => (
          <div key={title} className="bg-slate-900 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-400">{title}</div>
            <div className="mt-1 text-sm text-slate-300">{detail}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-500">For Fishbrain's current features, privacy defaults, and pricing, verify Fishbrain's own current product information.</p>
      {onStart && <button onClick={onStart} className="mt-5 px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider">Open FishAI</button>}
    </div>
  );
}
