import React, { useState } from 'react';

type RecordItem = { name: string; kind: string; lat?: number | null; lon?: number | null; lastVerified?: string | null; parking?: unknown; fee?: unknown; status?: unknown };
type Result = { items: RecordItem[]; retrievedAt: string; source: string; disclaimer: string; truncated: boolean };
const link = 'text-emerald-300 underline underline-offset-2 hover:text-emerald-200';
const panel = 'rounded-2xl border border-white/10 bg-slate-900 p-5';
const sources = {
  access: 'https://data.ontario.ca/dataset/fishing-access-points',
  fishOnline: 'https://data.ontario.ca/dataset/fish-on-line',
  lakes: 'https://data.ontario.ca/dataset/named-geographic-features',
  guide: 'https://www.ontario.ca/page/how-use-fish-line',
  licence: 'https://www.ontario.ca/page/open-government-licence-ontario',
  regs: 'https://www.ontario.ca/document/ontario-fishing-regulations-summary',
  updates: 'https://www.ontario.ca/page/fishing-notices-and-updates',
  trespass: 'https://www.ontario.ca/laws/statute/97f41',
};

export function OntarioFishingGuidePage() {
  const [name, setName] = useState('Muskoka');
  const [lat, setLat] = useState('42.100');
  const [lon, setLon] = useState('-83.110');
  const [mode, setMode] = useState<'lakes' | 'access'>('lakes');
  const [results, setResults] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setResults(null);
    const params = new URLSearchParams(mode === 'lakes' ? { mode, q: name } : { mode, lat, lon, radiusKm: '25' });
    try {
      const res = await fetch('/api/ontario-data?' + params);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResults(data as Result);
    } catch (e) { setError(e instanceof Error ? e.message : 'Search failed'); }
    finally { setLoading(false); }
  }
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10 text-slate-200 leading-relaxed">
      <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Ontario fishing resources | Reviewed October 10, 2026</p>
      <h1 className="mt-3 text-3xl sm:text-5xl font-display font-black text-white">Ontario fishing apps and access points: a verification-first guide</h1>
      <p className="mt-5 text-lg">Use Ontario's official resources to research waterbodies and regulations, then verify access before leaving home. FishAI's lookup can surface provincial records, but a map point is the start of an access check, not permission to enter or proof that a launch is open.</p>
      <p className="mt-3 text-sm text-slate-400">Editorial disclosure: FishAI publishes this guide. It uses Ontario open-data services and links to the province's current regulatory sources. FishAI is not affiliated with or endorsed by the Government of Ontario.</p>
      <p className="mt-3 text-sm">Researching a stocking row? Read <a className={link} href="/guides/ontario-fish-stocking-records">how to interpret Ontario fish stocking records</a> without treating a release as proof of present fish.</p>

      <section className="mt-8 grid sm:grid-cols-3 gap-4" aria-label="Fishing tool comparison">
        <div className={panel}><h2 className="font-bold text-white text-lg">Fish ON-Line</h2><p className="mt-2 text-sm">Ontario's official tool covers waterbodies, species observations, stocking, regulations, sanctuaries, access points and depth contours.</p><a className={link} href={sources.guide} target="_blank" rel="noreferrer">Government guide</a></div>
        <div className={panel}><h2 className="font-bold text-white text-lg">Social fishing apps</h2><p className="mt-2 text-sm">Community catches can help generate questions about a waterbody. They do not establish current access, fish presence, season or legal limits.</p><a className={link} href="/fishai-vs-fishbrain">Compare FishAI and Fishbrain</a></div>
        <div className={panel}><h2 className="font-bold text-white text-lg">FishAI</h2><p className="mt-2 text-sm">Use the beta lookup below for official geographic and access records, then complete the verification workflow before a trip.</p><a className={link} href="/">Open FishAI</a></div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-white">Explore Ontario open fishing data</h2>
        <p className="mt-2">This lookup requests separately licensed provincial datasets instead of scraping the Fish ON-Line viewer. Ontario's catalogue describes Fish ON-Line as covering more than 20,000 waterbodies. The standalone Fishing Access Points dataset is updated as required and its catalogue record was last validated April 30, 2015, so every result needs a current check.</p>
        <form onSubmit={search} className={panel + ' mt-5 space-y-4'}>
          <fieldset className="flex flex-wrap gap-4 text-sm">
            <legend className="font-bold text-white mb-2">Choose data</legend>
            <label><input type="radio" name="mode" checked={mode === 'lakes'} onChange={() => {setMode('lakes'); setResults(null);}} /> Lake names</label>
            <label><input type="radio" name="mode" checked={mode === 'access'} onChange={() => {setMode('access'); setResults(null);}} /> Fishing access</label>
          </fieldset>
          {mode === 'lakes' ?
            <label className="block text-sm">Lake name or partial name<input className="mt-1 block w-full rounded-lg bg-slate-950 border border-white/20 p-3 text-white" value={name} onChange={e => setName(e.target.value)} maxLength={50} required /></label> :
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-sm">Latitude<input className="mt-1 block w-full rounded-lg bg-slate-950 border border-white/20 p-3 text-white" type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} required /></label>
              <label className="block text-sm">Longitude<input className="mt-1 block w-full rounded-lg bg-slate-950 border border-white/20 p-3 text-white" type="number" step="any" value={lon} onChange={e => setLon(e.target.value)} required /></label>
            </div>}
          <button type="submit" disabled={loading} className="px-5 py-3 rounded-lg bg-emerald-400 text-slate-950 font-bold disabled:opacity-50">{loading ? 'Checking Ontario data...' : 'Search Ontario data'}</button>
          {mode === 'access' && <p className="text-xs text-slate-400">Example coordinates are near Amherstburg; search radius is 25 km. Coordinates are sent to the Ontario map service through FishAI.</p>}
        </form>
        {error && <p role="alert" className="mt-4 text-amber-300">Lookup unavailable: {error}. <a className={link} href={sources.guide}>Try Fish ON-Line directly.</a></p>}
        {results && <div className="mt-5">
          <p className="text-xs text-slate-400">Source: {results.source}. Retrieved {new Date(results.retrievedAt).toLocaleString('en-CA')}. {results.truncated ? 'Results may be truncated. Refine your query.' : ''}</p>
          {results.items.length === 0 ? <p className="mt-4">No matching records in this request. This does not establish that a lake or access point does not exist.</p> :
          <ul className="mt-3 grid sm:grid-cols-2 gap-3">{results.items.map((r, i) => <li className={panel} key={i}>
            <strong className="text-white">{r.name}</strong><p className="text-sm">{r.kind}</p>
            {r.lastVerified && <p className="text-xs text-slate-400">Last recorded verification: {r.lastVerified}</p>}
            {typeof r.lat === 'number' && typeof r.lon === 'number' && <a className={link} href={'https://www.openstreetmap.org/?mlat=' + r.lat + '&mlon=' + r.lon + '#map=12/' + r.lat + '/' + r.lon} target="_blank" rel="noreferrer">View approximate location</a>}
          </li>)}</ul>}
        </div>}
      </section>

      <section className={panel + ' mt-10'}>
        <h2 className="text-2xl font-bold text-white">Verify an access point before driving there</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-5">
          <div><h3 className="font-bold text-white">Confirm identity and location</h3><p className="mt-2 text-sm">Match the waterbody name, municipality, coordinates and access type. Similar lake names and pins on the wrong shoreline are common planning risks.</p></div>
          <div><h3 className="font-bold text-white">Check permission</h3><p className="mt-2 text-sm">A provincial record does not grant entry across private property. Review current signs, land ownership and operator information. Ontario law prohibits fishing-related entry that contravenes the Trespass to Property Act.</p></div>
          <div><h3 className="font-bold text-white">Check present-day operation</h3><p className="mt-2 text-sm">Confirm hours, seasonal gates, launch condition, parking, fees, water levels and whether the facility supports your boat or shore-access needs. Contact the current operator when the answer is unclear.</p></div>
          <div><h3 className="font-bold text-white">Check rules and notices</h3><p className="mt-2 text-sm">Identify the Fisheries Management Zone, then check the 2026 summary, waterbody exceptions, sanctuaries and current notices. Regulations and access are separate checks.</p></div>
        </div>
        <p className="mt-5 text-sm">Save the source URLs and the date you checked them. Recheck shortly before the trip, especially after storms, seasonal changes or local closure announcements.</p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-bold text-white">Source dates and limits</h2>
        <p>The Fish ON-Line catalogue entry was validated November 25, 2021. The Fishing Access Points catalogue entry lists April 30, 2015 as its last validated date and “as required” as the update frequency. Those dates describe catalogue records, not a promise that every mapped feature was field-checked then.</p>
        <p>The Ontario Fishing Regulations Summary is effective January 1, 2026 and its page was updated August 4, 2026. Ontario describes the summary as a convenient reference rather than a complete legal document, so follow linked notices and legal sources when a rule is uncertain.</p>
        <p className="text-sm">Contains information licensed under the Open Government Licence - Ontario. Information is provided as-is under that licence. FishAI has not reused government logos or suggested official status.</p>
        <ul className="text-sm space-y-1 list-disc pl-5">
          <li><a className={link} href={sources.fishOnline}>Fish ON-Line dataset catalogue</a></li>
          <li><a className={link} href={sources.access}>Fishing Access Points dataset</a></li>
          <li><a className={link} href={sources.lakes}>Geographic Names Ontario dataset</a></li>
          <li><a className={link} href={sources.regs}>2026 Ontario Fishing Regulations Summary</a></li>
          <li><a className={link} href={sources.updates}>Fishing notices and updates</a></li>
          <li><a className={link} href={sources.trespass}>Fish and Wildlife Conservation Act</a></li>
          <li><a className={link} href={sources.licence}>Open Government Licence - Ontario</a></li>
        </ul>
      </section>
    </article>
  );
}
