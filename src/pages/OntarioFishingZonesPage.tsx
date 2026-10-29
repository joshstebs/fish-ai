import React from 'react';

const zoneUrl = (zone: number) => `https://www.ontario.ca/document/ontario-fishing-regulations-summary/fisheries-management-zone-${zone}`;

const planningSteps = [
  ['Find the exact waterbody', 'Search Fish ON-Line by waterbody, fish type, location or stocking history. Record the waterbody name and nearby municipality so you do not confuse places with similar names.'],
  ['Confirm the zone', 'Use the official Fisheries Management Zones map and the waterbody details in Fish ON-Line. Boundary maps are planning aids, so check the detailed zone page when a location sits near a boundary.'],
  ['Read all three rule layers', 'Check zone-wide rules, species exceptions and waterbody exceptions. A zone-wide season or limit can be changed by a more specific exception.'],
  ['Check notices and access', 'Review current fishing notices and confirm access permission, hours, fees, closures and launch conditions with the responsible owner or operator.'],
];

export function OntarioFishingZonesPage() {
  const zones = Array.from({ length: 20 }, (_, index) => index + 1);
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <a href="/" className="text-sm font-bold text-emerald-400 hover:text-emerald-300">FishAI home</a>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Ontario regulations planner · reviewed October 29, 2026</p>
        <h1 className="mt-3 text-3xl sm:text-5xl font-display font-black tracking-tight">Ontario fishing zones: find the right rules for your waterbody</h1>
        <p className="mt-5 max-w-3xl text-base sm:text-lg leading-relaxed text-slate-300">Ontario has 20 Fisheries Management Zones. Use this planner to identify the right zone, open the current official zone page, and check exceptions before making a trip decision.</p>

        <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
          <h2 className="font-black text-amber-200">A zone page is only the starting point</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">The 2026 Ontario Fishing Regulations Summary is a convenient reference, not the complete law. Zone-wide rules may be changed by species exceptions, waterbody exceptions, fish sanctuaries and current notices. FishAI does not determine whether a catch is legal.</p>
        </div>

        <section className="mt-10" aria-labelledby="zone-links">
          <h2 id="zone-links" className="text-2xl font-black">Official pages for zones 1 to 20</h2>
          <p className="mt-2 text-sm text-slate-400">Each link opens the Government of Ontario page for that zone. These links do not imply that every waterbody inside a zone has identical rules.</p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {zones.map(zone => (
              <a key={zone} href={zoneUrl(zone)} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-slate-900 p-4 text-center font-black text-emerald-300 hover:border-emerald-400/50">
                Zone {zone}
              </a>
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="planning-workflow">
          <h2 id="planning-workflow" className="text-2xl font-black">Four checks for the right rule set</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {planningSteps.map(([title, detail], index) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Check {index + 1}</p>
                <h3 className="mt-2 font-black text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-2xl font-black">Trip rule worksheet</h2>
          <p className="mt-2 text-sm text-slate-400">Complete this after checking official sources. Entries stay in your browser and are not submitted.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {['Waterbody and nearby municipality', 'Fisheries Management Zone', 'Species and planned date', 'Zone-wide season and limit', 'Species or waterbody exception', 'Sanctuary or current notice checked'].map(label => (
              <label key={label} className="text-sm font-bold text-slate-200">{label}<input className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-3 text-white" /></label>
            ))}
          </div>
          <label className="mt-4 block text-sm font-bold text-slate-200">Official source URLs and access notes<textarea rows={4} className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-3 text-white" /></label>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-black">Official planning sources</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href="https://www.ontario.ca/document/ontario-fishing-regulations-summary/fisheries-management-zones-map" target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-slate-900 p-4 hover:border-emerald-400/40"><strong className="block text-emerald-300">Fisheries Management Zones map</strong><span className="mt-1 block text-sm text-slate-300">Government of Ontario zone map and zone links.</span></a>
            <a href="https://www.ontario.ca/document/ontario-fishing-regulations-summary" target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-slate-900 p-4 hover:border-emerald-400/40"><strong className="block text-emerald-300">2026 Fishing Regulations Summary</strong><span className="mt-1 block text-sm text-slate-300">Annual guide for licences, seasons, limits and zone rules.</span></a>
            <a href="https://www.ontario.ca/page/how-use-fish-line" target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-slate-900 p-4 hover:border-emerald-400/40"><strong className="block text-emerald-300">How to use Fish ON-Line</strong><span className="mt-1 block text-sm text-slate-300">Search instructions for waterbodies, fish information and map layers.</span></a>
            <a href="https://www.ontario.ca/page/fishing-notices-and-updates" target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-slate-900 p-4 hover:border-emerald-400/40"><strong className="block text-emerald-300">Fishing notices and updates</strong><span className="mt-1 block text-sm text-slate-300">Current official notices to recheck before leaving.</span></a>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">Sources reviewed October 29, 2026. FishAI is not affiliated with the Government of Ontario. Rules, notices and access conditions can change.</p>
        </section>

        <section className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-xl font-black">Continue planning</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">After identifying the zone, use the <a href="/guides/ontario-fishing-access" className="font-bold text-emerald-300">Ontario fishing access guide</a> to verify permission and operating conditions, then complete the <a href="/guides/ontario-fishing-licence-checklist" className="font-bold text-emerald-300">licence and regulations checklist</a>.</p>
        </section>
      </section>
    </main>
  );
}
