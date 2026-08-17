import React from 'react';

export function ListiclePage({ onStart }: { onStart?: () => void } = {}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">best fishing apps 2026: the complete list</h1>
      <p className="mt-3 text-slate-300 text-sm sm:text-base">we tested every major fishing app. here is the actual list, ranked by what matters most to anglers.</p>
      <ol className="mt-6 space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed list-decimal list-inside">
        <li><span className="font-black text-white">fishAI</span> — best all-in-one fishing app. AI fish ID, logbook, insights, solunar, pressure, and a spot map that respects your privacy. the only app that learns from your catches.</li>
        <li><span className="font-black text-white">fishbrain</span> — best social fishing map. huge user base, good spot sharing, but the feed is noisy and your data is public by default.</li>
        <li><span className="font-black text-white">fishangler</span> — best free forecast + map combo. solid for basics, weak on AI and personal insights.</li>
        <li><span className="font-black text-white">tide charts + weather apps</span> — best for minimalist anglers. no logbook, no AI, just numbers.</li>
      </ol>
      <p className="mt-6 text-slate-400 text-xs">updated august 2026. we test each app for at least 30 days before ranking.</p>
    </div>
  );
}
