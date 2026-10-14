import React, { useMemo, useState } from 'react';

const link = 'text-emerald-300 underline underline-offset-2 hover:text-emerald-200';
const panel = 'rounded-2xl border border-white/10 bg-slate-900 p-5';

export function OntarioFishStockingRecordsPage() {
  const [waterbody, setWaterbody] = useState('');
  const [species, setSpecies] = useState('');
  const [year, setYear] = useState('');
  const [quantity, setQuantity] = useState('');
  const summary = useMemo(() => {
    const parts = [
      waterbody.trim() ? waterbody.trim() : 'This waterbody',
      species.trim() ? 'has a recorded ' + species.trim() + ' stocking event' : 'has a recorded stocking event',
      year ? 'in ' + year : 'in the year shown by the source',
      quantity ? 'for ' + Number(quantity).toLocaleString('en-CA') + ' fish' : '',
    ].filter(Boolean);
    return parts.join(' ') + '. The record documents a release event. It does not establish present-day abundance, catchability, legal access or current regulations.';
  }, [waterbody, species, year, quantity]);

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10 text-slate-200 leading-relaxed">
      <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Ontario open fishing data | Reviewed October 11, 2026</p>
      <h1 className="mt-3 text-3xl sm:text-5xl font-display font-black text-white">How to read Ontario fish stocking records</h1>
      <p className="mt-5 text-lg">A stocking record answers a narrow question: what a source says was released, where and when. It is useful trip-research evidence, but it is not a promise that those fish are still present or available to catch.</p>
      <p className="mt-3 text-sm text-slate-400">Editorial disclosure: FishAI publishes this guide and is not affiliated with or endorsed by the Government of Ontario. The linked datasets are provincial sources licensed separately from FishAI.</p>

      <section className={panel + ' mt-8'}>
        <h2 className="text-2xl font-bold text-white">Turn one row into a cautious note</h2>
        <p className="mt-2">Copy only the fields you can verify in the official record. This worksheet stays in your browser and is not sent or saved.</p>
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <label className="text-sm">Waterbody<input className="mt-1 block w-full rounded-lg bg-slate-950 border border-white/20 p-3 text-white" value={waterbody} onChange={e => setWaterbody(e.target.value)} maxLength={80} placeholder="Example Lake" /></label>
          <label className="text-sm">Species<input className="mt-1 block w-full rounded-lg bg-slate-950 border border-white/20 p-3 text-white" value={species} onChange={e => setSpecies(e.target.value)} maxLength={60} placeholder="Brook trout" /></label>
          <label className="text-sm">Stocking year<input className="mt-1 block w-full rounded-lg bg-slate-950 border border-white/20 p-3 text-white" type="number" min="1900" max="2026" value={year} onChange={e => setYear(e.target.value)} placeholder="2022" /></label>
          <label className="text-sm">Recorded quantity<input className="mt-1 block w-full rounded-lg bg-slate-950 border border-white/20 p-3 text-white" type="number" min="0" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="1000" /></label>
        </div>
        <p className="mt-5 rounded-xl bg-slate-950 p-4 text-sm" role="status">{summary}</p>
      </section>

      <section className="mt-10 grid sm:grid-cols-2 gap-4">
        <div className={panel}><h2 className="text-xl font-bold text-white">Recent recreational records</h2><p className="mt-2 text-sm">Ontario's catalogue describes the recreational dataset as a subset of its fish stocking information system, covering the past ten years for events intended to promote recreational fishing. The catalogue currently shows a January 2013 to December 2022 date range, annual update frequency and March 17, 2023 validation date.</p><a className={link} href="https://data.ontario.ca/dataset/fish-stocking">Open the dataset record</a></div>
        <div className={panel}><h2 className="text-xl font-bold text-white">Historical records</h2><p className="mt-2 text-sm">The historical dataset covers 1900 through 2012 and includes fields such as species, rearing location, developmental stage, strain, spawning year and stocking date. It is valuable for history, not proof of a current fishery.</p><a className={link} href="https://data.ontario.ca/dataset/historical-fish-stocking-data">Open the historical dataset</a></div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-white">Questions to ask before using a record</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div className={panel}><h3 className="font-bold text-white">Is it the right waterbody?</h3><p className="mt-2 text-sm">Match the official waterbody identifier, name, municipality and map location. A shared or similar lake name is not enough.</p></div>
          <div className={panel}><h3 className="font-bold text-white">What was the purpose?</h3><p className="mt-2 text-sm">Do not mix recreational releases with rehabilitation or research activity. The public recreational dataset is explicitly a subset.</p></div>
          <div className={panel}><h3 className="font-bold text-white">What life stage was released?</h3><p className="mt-2 text-sm">Eggs, fry, fingerlings and older fish represent different events. Preserve the source field rather than translating every row into an equivalent catch opportunity.</p></div>
          <div className={panel}><h3 className="font-bold text-white">How old is the record?</h3><p className="mt-2 text-sm">Keep the stocking date and retrieval date visible. Older releases may still be relevant to management history, but uncertainty increases when discussing current conditions.</p></div>
        </div>
      </section>

      <section className={panel + ' mt-10'}>
        <h2 className="text-2xl font-bold text-white">Use stocking data inside a complete trip check</h2>
        <ol className="mt-4 list-decimal pl-5 space-y-3 text-sm">
          <li>Find the waterbody in <a className={link} href="https://www.ontario.ca/fishonline">Fish ON-Line</a> and confirm its identity.</li>
          <li>Read the stocking record as a dated release event, not a present-day population count.</li>
          <li>Check the current Fisheries Management Zone, waterbody exceptions, seasons and limits in the <a className={link} href="https://www.ontario.ca/document/ontario-fishing-regulations-summary">2026 regulations summary</a>.</li>
          <li>Verify access, ownership, gates, launch condition and local notices separately. A stocking location does not grant public entry.</li>
          <li>Record what you observed in your own logbook. FishAI can help organize trip conditions and catches, but personal records do not replace official rules.</li>
        </ol>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-bold text-white">Source and licence notes</h2>
        <p>Ontario says Fish ON-Line can be searched by waterbody, sport fish, stocked species and GPS coordinates. The province also says stocking occurs to support recreational fisheries and conservation goals. Those broad program descriptions do not turn any individual record into a forecast.</p>
        <p className="text-sm">Contains information licensed under the <a className={link} href="https://www.ontario.ca/page/open-government-licence-ontario">Open Government Licence - Ontario</a>. Source pages checked October 11, 2026. Information is provided as-is under that licence.</p>
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li><a className={link} href="https://data.ontario.ca/dataset/fish-stocking">Fish stocking data for recreational purposes</a></li>
          <li><a className={link} href="https://data.ontario.ca/dataset/historical-fish-stocking-data">Historical fish stocking data</a></li>
          <li><a className={link} href="https://data.ontario.ca/dataset/fish-on-line">Fish ON-Line catalogue</a></li>
          <li><a className={link} href="https://www.ontario.ca/page/ontarios-fish-stocking-program">Ontario fish stocking program</a></li>
        </ul>
      </section>
      <nav className="mt-10 flex flex-wrap gap-3"><a className="px-4 py-2.5 rounded-lg bg-emerald-400 text-slate-950 font-bold" href="/">Open FishAI</a><a className={link} href="/guides/best-fishing-app-ontario">Ontario access and app guide</a></nav>
    </article>
  );
}
