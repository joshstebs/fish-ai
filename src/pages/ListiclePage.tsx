import React from 'react';

export function ListiclePage({ onStart }: { onStart?: () => void } = {}) {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-slate-300 text-sm sm:text-base leading-relaxed">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">Fishing apps in 2026: which tools fit your trip?</h1>
      <p className="mt-4">Different apps solve different problems. A social map can help you discover water, a weather tool can help you plan, and a private logbook can help you understand your own trips. Decide what matters to you before choosing a subscription.</p>
      <p className="mt-4 text-sm text-slate-400">Editorial disclosure: FishAI publishes this guide and is one of the options below. This is a feature-based comparison, not a ranked benchmark or a claim that every competing app has been independently tested. Features and prices can change, so check each provider before purchasing.</p>
      <section className="mt-8 space-y-5">
        <div>
          <h2 className="font-bold text-xl text-white">FishAI: catching and keeping your own records</h2>
          <p className="mt-2">Explore the catch-photo workflow, weather information, solunar timing, location notes, and private catch journal. Before relying on a photo estimate or a species suggestion, compare it with a physical measurement and current local fishing regulations. Check which features need connectivity or a paid tier.</p>
          <a className="text-emerald-300 underline" href="/">Try the FishAI tools</a>
        </div>
        <div>
          <h2 className="font-bold text-xl text-white">Fishbrain: consider community discovery</h2>
          <p className="mt-2">If you mainly want to explore community-shared reports and fishing locations, inspect the map and privacy controls with your own area in mind. Evaluate whether recent local activity is available and whether sharing controls match your preferences.</p>
          <a className="text-emerald-300 underline" href="/fishai-vs-fishbrain">Read our FishAI and Fishbrain comparison</a>
        </div>
        <div>
          <h2 className="font-bold text-xl text-white">FishAngler: consider trip planning and forecasts</h2>
          <p className="mt-2">If planning around weather, forecasts and shared catches is central to your routine, compare the practical forecast view and logbook details. Try recording an actual trip before deciding which interface is easier to maintain.</p>
          <a className="text-emerald-300 underline" href="/fishai-vs-fishangler">Read our FishAI and FishAngler comparison</a>
        </div>
      </section>
      <section className="mt-8">
        <h2 className="font-bold text-xl text-white">Five checks to make before choosing</h2>
        <ol className="mt-3 list-decimal pl-6 space-y-2">
          <li>Open the map in your actual fishing area and check how current the information is.</li>
          <li>Record a sample catch, then try finding it again in the logbook.</li>
          <li>Inspect the privacy policy and location-sharing settings before saving sensitive spots.</li>
          <li>Check availability offline and distinguish estimates from legally binding regulations.</li>
          <li>Read the current free-tier limits and renewal terms from each provider.</li>
        </ol>
        <p className="mt-5">For a more detailed decision worksheet, use our <a className="text-emerald-300 underline" href="/how-to-choose">guide to choosing a fishing app</a> or review the <a className="text-emerald-300 underline" href="/guides/ontario-fishing-licence-checklist">Ontario licence checklist</a>.</p>
        <p className="mt-4 text-xs text-slate-400">Updated October 2026. Feature summaries are editorial descriptions, not controlled performance measurements.</p>
        {onStart && <button className="mt-5 rounded-lg bg-emerald-400 px-5 py-3 font-bold text-slate-950" onClick={onStart}>Open FishAI</button>}
      </section>
    </main>
  );
}
