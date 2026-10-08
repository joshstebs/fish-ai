import React from 'react';
export function CompareFishbrainPage({ onStart }: { onStart?: () => void } = {}) {
  return <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-slate-300 leading-relaxed">
    <h1 className="text-3xl sm:text-4xl font-display font-black text-white">FishAI vs Fishbrain: features worth comparing</h1>
    <p className="mt-4">Both products present tools for anglers, but feature availability, pricing and coverage can change. This page compares public documentation, not independent performance tests. FishAI publishes this comparison.</p>
    <div className="mt-6 space-y-4">
      <section className="bg-slate-900 rounded-xl p-5"><h2 className="text-white text-lg font-bold">Catch history and privacy</h2><p>Fishbrain documents a catch log with species, location, gear, weather and solunar data. It offers choices for exact location sharing, water-name-only sharing and private entries. FishAI provides a catch log in its app; verify storage and export behaviour on your device before depending on it.</p></section>
      <section className="bg-slate-900 rounded-xl p-5"><h2 className="text-white text-lg font-bold">Photo fish identification</h2><p>Both products advertise fish identification from photos. Fishbrain's current documentation explicitly describes its Fish ID tool. Neither product's identification accuracy has been independently tested for this comparison. A photo estimate is not regulatory proof.</p></section>
      <section className="bg-slate-900 rounded-xl p-5"><h2 className="text-white text-lg font-bold">Maps and planning</h2><p>Fishbrain describes mapping tools including contours and private waypoints. FishAI presents conditions, logbook, solunar and fishing tools. Compare your specific Ontario waterbody and the paid-plan requirements before choosing.</p></section>
    </div>
    <p className="mt-6 text-sm">Sources: <a className="underline text-emerald-300" href="https://fishbrain.com/features/logbook">Fishbrain logbook and Fish ID</a> · <a className="underline text-emerald-300" href="https://support.fishbrain.com/hc/en-us/articles/22539014580508-The-Fishbrain-map-what-it-is-and-how-to-use-it">Fishbrain maps</a> · <a className="underline text-emerald-300" href="/guides/best-fishing-app-ontario">Ontario comparison and official data</a>.</p>
    <button className="mt-6 px-4 py-2 bg-emerald-400 text-slate-950 rounded-lg font-bold" onClick={onStart}>Explore FishAI</button>
  </article>;
}