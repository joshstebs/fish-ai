import React from 'react';

export function ListiclePage({ onStart }: { onStart?: () => void } = {}) {
  const criteria = [
    ['Social discovery', 'Choose a product with a large community if public catches, follows, and shared spots are the main goal.'],
    ['Private personal log', 'Choose local-first storage if you want your own catch history to remain the center of the workflow.'],
    ['Weather and timing', 'Check whether conditions are live, where they come from, and whether timing is calculated for your actual coordinates.'],
    ['AI image analysis', 'Treat species and dimension output as estimates. Look for confidence, failure states, and clear limits rather than guaranteed accuracy.'],
    ['Regulations', 'Use current official jurisdiction sources for legal decisions. An AI fishing app should not replace them.'],
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">How to compare fishing apps in 2026</h1>
      <p className="mt-3 text-slate-300 text-sm sm:text-base">
        A criteria-based checklist instead of an unverifiable ranking.
      </p>
      <div className="mt-6 space-y-3">
        {criteria.map(([title, detail]) => (
          <div key={title} className="bg-slate-900 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-400">{title}</div>
            <div className="mt-1 text-sm text-slate-300">{detail}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-slate-400 text-xs">
        FishAI focuses on a local-first logbook, live weather, computed solunar timing, saved spots, and optional AI image analysis. Verify current competitor features and prices directly with those providers.
      </p>
      {onStart && <button onClick={onStart} className="mt-5 px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider">Open FishAI</button>}
    </div>
  );
}
