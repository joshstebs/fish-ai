import React from 'react';

const sources = [
  ['Fish ON-Line dataset', 'https://data.ontario.ca/dataset/fish-on-line', 'Ontario open data catalogue for the Fish ON-Line resources and related downloads.'],
  ['How to use Fish ON-Line', 'https://www.ontario.ca/page/how-use-fish-line', 'Ontario guidance for searching waterbodies, fish information and map layers.'],
  ['Fishing regulations summary', 'https://www.ontario.ca/document/ontario-fishing-regulations-summary', 'Current Ontario rules, zones and exceptions.'],
  ['Fishing notices and updates', 'https://www.ontario.ca/page/fishing-notices-and-updates', 'Official notices that may change a trip after a regulation summary was published.'],
];

const checks = [
  ['Identify the waterbody', 'Record the official waterbody name, nearby municipality and any alternate names. Similar names can refer to different places.'],
  ['Check the map layer', 'Use Fish ON-Line as a discovery and research source. A coordinate or map marker does not prove that a launch, shoreline or road is open to the public.'],
  ['Verify permission', 'Confirm the landowner, park, conservation authority, marina or municipality permits fishing and access on the date of your trip. Check fees, hours, closures and launch conditions.'],
  ['Match the zone', 'Confirm the Fisheries Management Zone and read the current species, season, size and possession rules, including waterbody-specific exceptions.'],
  ['Recheck notices', 'Look for current Ontario fishing notices shortly before leaving. A notice can change conditions after a printed summary was released.'],
];

export function OntarioFishingAccessGuidePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <a href="/" className="text-sm font-bold text-emerald-400 hover:text-emerald-300">FishAI home</a>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Ontario trip planning · reviewed October 20, 2026</p>
        <h1 className="mt-3 text-3xl sm:text-5xl font-display font-black tracking-tight">Ontario fishing access guide: how to verify a spot before you go</h1>
        <p className="mt-5 max-w-3xl text-base sm:text-lg leading-relaxed text-slate-300">Use official map and regulatory sources to research an Ontario waterbody, then verify permission and operating details separately. This guide helps you avoid treating a database record or map coordinate as proof of public access.</p>

        <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
          <h2 className="font-black text-amber-200">A recorded point is not a legal-access decision</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">Fish ON-Line and other datasets can help you find and identify waterbodies. They do not by themselves confirm public shoreline rights, a working launch, permission to cross private land, current hours or safe conditions. Confirm those details with the responsible owner or operator.</p>
        </div>

        <section className="mt-10" aria-labelledby="access-checklist">
          <h2 id="access-checklist" className="text-2xl font-black">Five checks for one Ontario fishing trip</h2>
          <div className="mt-5 grid gap-4">
            {checks.map(([title, detail]) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-slate-900 p-5">
                <span aria-hidden="true" className="mt-1 text-emerald-400 font-black">✓</span>
                <span><strong className="block text-emerald-300">{title}</strong><span className="mt-1 block text-sm leading-relaxed text-slate-300">{detail}</span></span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-2xl font-black">Research worksheet</h2>
          <p className="mt-2 text-sm text-slate-400">Write down the source and retrieval date for each answer. This worksheet stays in your browser and is not submitted.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {['Official waterbody name', 'Municipality or region', 'Fisheries Management Zone', 'Access owner or operator', 'Hours, fees or launch notes', 'Rules checked on'].map(label => (
              <label key={label} className="text-sm font-bold text-slate-200">{label}<input className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-3 text-white" /></label>
            ))}
          </div>
          <label className="mt-4 block text-sm font-bold text-slate-200">Source URLs and unresolved questions<textarea rows={4} className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-3 text-white" /></label>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-black">Official sources to check</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {sources.map(([label, href, detail]) => <a key={href} href={href} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/10 bg-slate-900 p-4 hover:border-emerald-400/40"><strong className="block text-emerald-300">{label}</strong><span className="mt-1 block text-sm text-slate-300">{detail}</span><span className="mt-2 block text-xs text-slate-500">Government of Ontario</span></a>)}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">Sources reviewed October 20, 2026. FishAI is not affiliated with the Government of Ontario. Regulations, notices, access conditions and operator information can change.</p>
        </section>

        <section className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-xl font-black">Use FishAI after the location is verified</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">Once you have confirmed the waterbody, permission and current rules, use FishAI's <a href="/guides/best-fishing-app-ontario" className="font-bold text-emerald-300">Ontario fishing guide</a> for trip planning. Keep the <a href="/guides/ontario-fishing-licence-checklist" className="font-bold text-emerald-300">licence and regulations checklist</a> beside your trip notes.</p>
        </section>
      </section>
    </main>
  );
}
