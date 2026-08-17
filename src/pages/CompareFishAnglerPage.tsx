import React from 'react';

export function CompareFishAnglerPage({ onStart }: { onStart?: () => void } = {}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">fishAI vs fishangler</h1>
      <p className="mt-3 text-slate-300 text-sm sm:text-base">fishangler is maps + forecasts. fishAI is your personal fishing coach.</p>
      <div className="mt-6 grid gap-3">
        {[
          ['AI fish ID', 'fishangler: no. fishAI: yes.'],
          ['logbook insights', 'fishangler: basic. fishAI: personalized patterns.'],
          ['solunar + pressure', 'fishangler: basic. fishAI: exact math + live trends.'],
          ['offline use', 'fishangler: limited. fishAI: logbook works offline.'],
          ['price', 'fishangler: free. fishAI: free core, $7.99/mo pro.'],
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
