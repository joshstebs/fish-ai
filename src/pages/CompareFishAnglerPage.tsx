import React from 'react';
export function CompareFishAnglerPage({ onStart }: { onStart?: () => void } = {}) {
  return <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-slate-300 leading-relaxed">
    <h1 className="text-3xl sm:text-4xl font-display font-black text-white">FishAI vs FishAngler: compare what matters</h1>
    <p className="mt-4">FishAngler publicly describes mapping, detailed catch logging, forecasts, private waypoints and AI fish identification. FishAI offers its own fishing tools. This is a vendor-documentation comparison, not hands-on validation; FishAI publishes this page.</p>
    <div className="mt-6 space-y-4">
      <section className="bg-slate-900 rounded-xl p-5"><h2 className="text-white text-lg font-bold">Weather and fishing forecasts</h2><p>FishAngler describes pressure, moon timing, weather and bite-window forecasts. FishAI presents weather and solunar tools. No conclusion about which is more accurate can be made without controlled field measurements.</p></section>
      <section className="bg-slate-900 rounded-xl p-5"><h2 className="text-white text-lg font-bold">Catch tracking and private spots</h2><p>FishAngler documents catch history and configurable privacy, including private catches and waypoints. FishAI has its own catch log and spot map. Test syncing, offline behaviour, backups and privacy settings on your actual device.</p></section>
      <section className="bg-slate-900 rounded-xl p-5"><h2 className="text-white text-lg font-bold">Species identification and price</h2><p>Both products advertise photo-based identification. Check currently offered subscription tiers directly with each provider instead of relying on an outdated pricing table.</p></section>
    </div>
    <p className="mt-6 text-sm">Sources: <a className="underline text-emerald-300" href="https://www.fishangler.com/membership">FishAngler membership features</a> · <a className="underline text-emerald-300" href="https://www.fishangler.com/">FishAngler product page</a> · <a className="underline text-emerald-300" href="/guides/best-fishing-app-ontario">Ontario fishing data guide</a>.</p>
    <button className="mt-6 px-4 py-2 bg-emerald-400 text-slate-950 rounded-lg font-bold" onClick={onStart}>Explore FishAI</button>
  </article>;
}