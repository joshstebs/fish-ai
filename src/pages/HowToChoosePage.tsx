import React from 'react';

export function HowToChoosePage({ onStart }: { onStart?: () => void } = {}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">How to choose a fishing app</h1>
      <p className="mt-3 text-slate-300 text-sm sm:text-base">Start with the workflow you need, then verify how the app obtains and stores its data.</p>
      <div className="mt-6 grid gap-3">
        {[
          ['Identification', 'Does it show uncertainty and allow correction, or present AI output as certain?'],
          ['Logbook', 'Can you export it, and is your catch history stored locally or on a provider server?'],
          ['Conditions', 'Are weather and pressure live, cached, or merely static examples?'],
          ['Privacy', 'Which network features send coordinates or photos to third parties?'],
          ['Regulations', 'Does the product point you back to current official rules instead of pretending AI can make the legal decision?'],
        ].map(([title, detail]) => (
          <div key={title} className="bg-slate-900 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-400">{title}</div>
            <div className="mt-1 text-sm text-slate-300">{detail}</div>
          </div>
        ))}
      </div>
      {onStart && <button onClick={onStart} className="mt-6 px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider">Open FishAI</button>}
    </div>
  );
}
