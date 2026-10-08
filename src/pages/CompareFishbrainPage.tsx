import React from 'react';
export function CompareFishbrainPage({ onStart }: { onStart?: () => void } = {}) {
  return <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-slate-300 leading-relaxed">
    <h1 className="text-3xl sm:text-4xl font-display font-black text-white">FishAI vs Fishbrain: features worth comparing</h1>
    <p className="mt-4">Both products present tools for anglers, but feature availability, pricing and coverage can change. This page compares public documentation, not independent performance tests. FishAI publishes this comparison.</p>
    <div className="mt-6 space-y-4">
      <section className="bg-slate-900 rounded-xl p-5"><h2 className="text-white text-lg font-bold">Catch history and privacy</h2><p>Fishbrain documents a catch log with species, location, gear, weather and solunar data. It offers choices for exact location sharing, water-name-only sharing and private entries. FishAI provides a catch log in its app; verify storage and export behaviour on your device before depending on it.</p></section>
      <section className="bg-slate-900 rounded-xl p-5"><h2 className="text-white text-lg font-bold">Photo fish identification</h2><p>Both products advertise fish identification from photos. Check the currently available identification tool and subscription tier directly in each app. Neither product's identification accuracy has been independently tested for this comparison. A photo estimate is not regulatory proof.</p></section>
      <section className="bg-slate-900 rounded-xl p-5"><h2 className="text-white text-lg font-bold">Maps and planning</h2><p>Fishbrain describes mapping tools including contours and private waypoints. FishAI presents conditions, logbook, solunar and fishing tools. Compare your specific Ontario waterbody and the paid-plan requirements before choosing.</p></section>
    </div>
    <section className="mt-7 bg-slate-900 rounded-xl p-5">
      <h2 className="text-white text-xl font-bold">Choose by the trip you want to plan</h2>
      <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[540px] text-sm text-left border-collapse">
        <thead><tr><th className="p-3">Task</th><th className="p-3">Fishbrain documentation</th><th className="p-3">FishAI path to try</th></tr></thead>
        <tbody>
          <tr className="border-t border-white/20"><td className="p-3">Research community catches</td><td className="p-3">Its map describes community reports and species filters; exact catch pins are described as a Pro feature.</td><td className="p-3">The Ontario lookup searches official records. It is not evidence of a comparable community catch database.</td></tr>
          <tr className="border-t border-white/20"><td className="p-3">Keep a location private</td><td className="p-3">Its logbook offers exact-location, water-name-only and private sharing choices.</td><td className="p-3">Check a test entry's actual storage, visibility and recovery. Private storage and recoverable backups are separate questions.</td></tr>
          <tr className="border-t border-white/20"><td className="p-3">Investigate an Ontario lake</td><td className="p-3">Check your specific lake and available map layer before paying.</td><td className="p-3"><a className="text-emerald-300 underline" href="/guides/best-fishing-app-ontario">Try the official-data lookup</a>; confirm current access and regulations independently.</td></tr>
        </tbody>
      </table></div>
      <p className="mt-4">Fishbrain's documented community map may fit anglers looking for shared catch reports. FishAI's Ontario lookup is a different workflow for official geographic and access records. Neither workflow establishes that fish are present today or that a property can be entered.</p>
    </section>
    <section className="mt-7">
      <h2 className="text-white text-xl font-bold">A fair comparison before subscribing</h2>
      <p className="mt-3">Use the same familiar lake in both apps, create a test catch, inspect location visibility and try recovering or exporting that record. Record the device, date, subscription tier and missing features. Use our <a className="text-emerald-300 underline" href="/how-to-choose">fishing app trial worksheet</a> to separate tested results from vendor descriptions.</p>
      <p className="mt-3">Pricing is not verified here. Check the checkout in your currency and record the billing period, trial expiry, renewal and cancellation terms. Do not compare a monthly price with an annual price divided by twelve without showing the annual commitment.</p>
      <p className="mt-3 text-sm">Documentation reviewed October 8, 2026 using retrieved official-source excerpts. No hands-on competitor test, Canadian lake-coverage audit or accuracy benchmark was performed.</p>
    </section>
    <p className="mt-6 text-sm">Sources: <a className="underline text-emerald-300" href="https://fishbrain.com/features/logbook">Fishbrain logbook</a> · <a className="underline text-emerald-300" href="https://fishbrain.com/features/fishing-spots">Fishbrain maps</a> · <a className="underline text-emerald-300" href="/guides/best-fishing-app-ontario">Ontario comparison and official data</a>.</p>
    <button className="mt-6 px-4 py-2 bg-emerald-400 text-slate-950 rounded-lg font-bold" onClick={onStart}>Explore FishAI</button>
  </article>;
}