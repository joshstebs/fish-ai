import React from 'react';

export function HowToChoosePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">how to choose a fishing app in 2026</h1>
      <p className="mt-3 text-slate-300 text-sm sm:text-base">most fishing apps solve one problem. the best fishing app solves five.</p>
      <div className="mt-6 grid gap-3">
        {[
          ['AI fish ID', 'if you catch and release, species accuracy matters.'],
          ['logbook + insights', 'your past catches predict your next ones.'],
          ['real weather + solunar', 'generic forecasts are not enough.'],
          ['privacy', 'your spots should stay yours.'],
          ['assistant', 'answers from your data, not generic tips.'],
        ].map(([t,d]) => (
          <div key={t} className="bg-slate-900 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-400">{t}</div>
            <div className="mt-1 text-sm text-slate-300">{d}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-slate-300 text-sm">fishAI is the only fishing app built around all five.</p>
    </div>
  );
}
