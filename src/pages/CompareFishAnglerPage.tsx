import React from 'react';

const link = 'text-emerald-300 underline underline-offset-2 hover:text-emerald-200';
const panel = 'rounded-2xl border border-white/10 bg-slate-900 p-5';

export function CompareFishAnglerPage({ onStart }: { onStart?: () => void } = {}) {
  return <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10 text-slate-300 leading-relaxed">
    <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Fishing app comparison | Reviewed October 10, 2026</p>
    <h1 className="mt-3 text-3xl sm:text-5xl font-display font-black text-white">FishAI vs FishAngler: maps, logs, forecasts and privacy compared</h1>
    <p className="mt-5 text-lg">FishAngler and FishAI overlap in catch logging, maps and trip planning, but they organize those jobs differently. This comparison turns published features into a test plan so you can choose using your own lake, phone and privacy needs.</p>
    <p className="mt-3 text-sm text-slate-400">Disclosure: FishAI publishes this page. FishAngler information comes from its official product, FAQ and privacy pages. We did not run a controlled accuracy study, Canadian coverage audit or paid subscription test. Features and tiers can change.</p>

    <section className={panel + ' mt-8'}>
      <h2 className="text-2xl font-bold text-white">Quick task comparison</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm text-left">
          <thead><tr className="border-b border-white/20"><th className="p-3">Task</th><th className="p-3">FishAngler documentation</th><th className="p-3">FishAI path to test</th><th className="p-3">What to verify</th></tr></thead>
          <tbody>
            <tr className="border-b border-white/10"><td className="p-3 font-semibold text-white">Research a waterbody</td><td className="p-3">Maps with catches, spots, reports and premium map layers are described.</td><td className="p-3">Explore Map plus the Ontario official-data lookup.</td><td className="p-3">Your exact lake, layer availability, date and subscription tier.</td></tr>
            <tr className="border-b border-white/10"><td className="p-3 font-semibold text-white">Record a catch</td><td className="p-3">A detailed catch log and automatic weather tagging are described.</td><td className="p-3">Catch Logbook with personal entries and insights.</td><td className="p-3">Required fields, editing, export, backup and offline behaviour.</td></tr>
            <tr className="border-b border-white/10"><td className="p-3 font-semibold text-white">Save a private place</td><td className="p-3">Private waypoints are listed as a VIP feature and private by default.</td><td className="p-3">Spot Map for personal locations.</td><td className="p-3">Where the record is stored, who can see it and how it is recovered.</td></tr>
            <tr><td className="p-3 font-semibold text-white">Plan around conditions</td><td className="p-3">Forecasts, marine data and inland monitoring are described.</td><td className="p-3">Weather, solunar and barometric tools.</td><td className="p-3">Station location, forecast timestamp and observed conditions.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <div className="mt-8 grid md:grid-cols-2 gap-4">
      <section className={panel}><h2 className="text-xl font-bold text-white">Maps and community information</h2><p className="mt-3">FishAngler's official pages describe a community map with catches, fishing spots, reports, photos and map layers. Its FAQ places exact catch positions and several premium layers in VIP. Treat a community pin as a report to investigate, not proof of public access or current fish activity.</p></section>
      <section className={panel}><h2 className="text-xl font-bold text-white">Ontario official-data workflow</h2><p className="mt-3">FishAI's Ontario guide queries separately licensed provincial geographic and fishing-access datasets. These records serve a different purpose from social catch reports. They can help locate named waters and recorded access features, but they do not establish permission, operating status or safe navigation.</p><a className={link} href="/guides/best-fishing-app-ontario">Try the Ontario lookup</a></section>
      <section className={panel}><h2 className="text-xl font-bold text-white">Catch logs and privacy</h2><p className="mt-3">FishAngler describes more than 45 catch attributes and configurable privacy. Its published privacy policy also describes collection of account, content, location, activity and device information. FishAI stores personal catches and spots through its own workflow. In either app, test one entry before importing years of records.</p></section>
      <section className={panel}><h2 className="text-xl font-bold text-white">Forecasts and recommendations</h2><p className="mt-3">Both products present planning signals. A forecast or bite window is not a measured promise of a catch. Compare the displayed source, location and time with the conditions you actually observe, then decide whether the signal helps your own planning.</p></section>
    </div>

    <section className={panel + ' mt-8'}>
      <h2 className="text-2xl font-bold text-white">Run a fair 20-minute trial</h2>
      <ul className="mt-4 space-y-3 list-disc pl-5">
        <li>Open the same familiar waterbody in both apps and record which layers and records are actually available.</li>
        <li>Create one test catch with an approximate location. Inspect every visibility control from another signed-out view if the app supports sharing.</li>
        <li>Create a private waypoint or spot, close the app, reopen it and confirm the entry remains available.</li>
        <li>Check the forecast timestamp and location. Compare it with a current weather source and the conditions at the water.</li>
        <li>Open checkout in your currency. Record the billing period, trial end, renewal amount and cancellation route before subscribing.</li>
      </ul>
      <p className="mt-4">Use the same device and subscription state for both trials. A feature shown on a marketing page may be limited by region, platform, account or paid tier.</p>
      <a className={link} href="/how-to-choose">Open the full fishing-app trial worksheet</a>
    </section>

    <section className="mt-8 space-y-3">
      <h2 className="text-2xl font-bold text-white">Which app should you start with?</h2>
      <p>Start with FishAngler if its documented community map, detailed catch attributes and premium marine or terrain layers match the trip you are planning. Start with FishAI if you want to test its personal tools and Ontario official-data workflow. Many anglers may use an official government source for rules and access research alongside a separate personal logbook.</p>
      <p>No app replaces current regulations, property permission, local closure notices or safe boating judgment. Photo identification is also not regulatory proof of species, size or legality.</p>
    </section>

    <footer className="mt-10 pt-6 border-t border-white/10 text-sm text-slate-400">
      Sources checked October 10, 2026: <a className={link} href="https://app.fishangler.com/">FishAngler product page</a> · <a className={link} href="https://www.home.fishangler.com/faq/">FishAngler FAQ</a> · <a className={link} href="https://www.fishangler.com/privacy/">FishAngler privacy policy</a> · FishAI production source at revision 3310c0a. Pricing was intentionally not copied because checkout terms can change.
    </footer>
    <button className="mt-6 px-5 py-3 bg-emerald-400 text-slate-950 rounded-lg font-bold" onClick={onStart}>Explore FishAI</button>
  </article>;
}
