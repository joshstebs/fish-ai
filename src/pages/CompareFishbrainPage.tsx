import React from 'react';

export function CompareFishbrainPage({ onStart }: { onStart?: () => void } = {}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">fishAI vs fishbrain</h1>
      <p className="mt-3 text-slate-300 text-sm sm:text-base">fishbrain is a social map. fishAI is a personal fishing intelligence system.</p>
      <div className="mt-6 grid gap-3">
        {[
          ['AI fish ID', 'fishbrain: no. fishAI: yes, with confidence scores.'],
          ['private logbook', 'fishbrain: public by default. fishAI: local by default.'],
          ['solunar math', 'fishbrain: generic tables. fishAI: exact for your spot and date.'],
          ['assistant', 'fishbrain: generic tips. fishAI: answers from your catches.'],
          ['price', 'fishbrain: free with ads. fishAI: free core, $7.99/mo pro.'],
        ].map(([t,d]) => (
          <div key={t} className="bg-slate-900 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-400">{t}</div>
            <div className="mt-1 text-sm text-slate-300">{d}</div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button onClick={onStart} className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg">open fishAI</button>
      </div>
    </div>
  );
}
