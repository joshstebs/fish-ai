import React from 'react';

const OFFICIAL = [
  ['Licence and Outdoors Card', 'https://www.ontario.ca/page/fishing-licence-canadian-residents'],
  ['2026 Fishing Regulations Summary', 'https://www.ontario.ca/document/ontario-fishing-regulations-summary'],
  ['Current fishing notices', 'https://www.ontario.ca/page/fishing-notices-and-updates'],
  ['Fish ON-Line', 'https://www.ontario.ca/page/how-use-fish-line'],
];

const checks = [
  ['Identity', 'Confirm who is fishing and which licence rules apply. Most people need either an Outdoors Card plus fishing licence, or a deemed licence exemption.'],
  ['Carry', 'Bring the Outdoors Card when required and the licence summary. A saved official PDF can count as a digital copy; a screenshot or photo does not.'],
  ['Place', 'Confirm the exact waterbody and Fisheries Management Zone. Similar lake names can point to different rules.'],
  ['Rules', 'Read the 2026 zone rules and every waterbody-specific exception that applies to the trip.'],
  ['Updates', 'Check current notices shortly before departure for closures or changes published after the summary.'],
  ['Access', 'Verify permission, operating status, fees and launch conditions independently. A map point is not proof of legal public access.'],
];

export function OntarioFishingLicenceChecklistPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <a href="/" className="text-sm font-bold text-emerald-400 hover:text-emerald-300">FishAI home</a>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Ontario trip planning · reviewed October 13, 2026</p>
        <h1 className="mt-3 text-3xl sm:text-5xl font-display font-black tracking-tight">Ontario fishing licence and regulations checklist</h1>
        <p className="mt-5 max-w-3xl text-base sm:text-lg leading-relaxed text-slate-300">
          Use this pre-trip worksheet to verify the documents, zone and current rules for one Ontario fishing trip. It organizes official links in the order you need them and does not replace the regulations.
        </p>

        <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
          <h2 className="font-black text-amber-200">The digital-document detail that is easy to miss</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">
            Ontario says a digital licence summary must be the official PDF. A screenshot or photo is not accepted. You are responsible for keeping the device charged, readable and protected. Check the official licence page below before relying on a phone.
          </p>
        </div>

        <section className="mt-10" aria-labelledby="trip-checklist">
          <h2 id="trip-checklist" className="text-2xl font-black">Six checks before you leave</h2>
          <div className="mt-5 grid gap-4">
            {checks.map(([title, detail]) => (
              <label key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-slate-900 p-5">
                <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-emerald-400" />
                <span><strong className="block text-emerald-300">{title}</strong><span className="mt-1 block text-sm leading-relaxed text-slate-300">{detail}</span></span>
              </label>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-2xl font-black">Trip record</h2>
          <p className="mt-2 text-sm text-slate-400">Fill this out while checking the official sources. The fields stay on this page and are not submitted.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {['Waterbody and municipality', 'Fisheries Management Zone', 'Licence type and expiry', 'Rules checked on'].map(label => (
              <label key={label} className="text-sm font-bold text-slate-200">{label}<input className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-3 text-white" /></label>
            ))}
          </div>
          <label className="mt-4 block text-sm font-bold text-slate-200">Exceptions, notices and access notes<textarea rows={4} className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-3 text-white" /></label>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-black">Official Ontario sources</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {OFFICIAL.map(([label, href]) => <li key={href}><a href={href} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/10 bg-slate-900 p-4 font-bold text-emerald-300 hover:border-emerald-400/40">{label}<span className="mt-1 block text-xs font-normal text-slate-400">Government of Ontario</span></a></li>)}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">Sources reviewed October 13, 2026. Regulations and notices can change. FishAI is not affiliated with the Government of Ontario and this worksheet is not legal advice.</p>
        </section>

        <section className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-xl font-black">Plan the waterbody separately</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">Use the <a href="/guides/best-fishing-app-ontario" className="font-bold text-emerald-300">Ontario lake and recorded access search</a> to identify the waterbody and nearby recorded access features. Then return here to verify rules and permission.</p>
        </section>
      </section>
    </main>
  );
}
