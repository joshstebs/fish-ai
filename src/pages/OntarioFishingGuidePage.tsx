import React, { useState } from 'react';

type RecordItem = { name: string; kind: string; lat?: number | null; lon?: number | null; lastVerified?: string | null; parking?: unknown; fee?: unknown; status?: unknown };
type Result = { items: RecordItem[]; retrievedAt: string; source: string; disclaimer: string; truncated: boolean };
const link = 'text-emerald-300 underline underline-offset-2 hover:text-emerald-200';
const panel = 'rounded-2xl border border-white/10 bg-slate-900 p-5';
const sources = {
  access: 'https://data.ontario.ca/dataset/fishing-access-points',
  lakes: 'https://data.ontario.ca/dataset/named-geographic-features',
  guide: 'https://www.ontario.ca/page/how-use-fish-line',
  licence: 'https://www.ontario.ca/page/open-government-licence-ontario',
  regs: 'https://www.ontario.ca/document/ontario-fishing-regulations-summary',
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
      <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Ontario fishing resources | Reviewed October 2026</p>
      <h1 className="mt-3 text-3xl sm:text-5xl font-display font-black text-white">Ontario fishing apps compared: Fish ON-Line, Fishbrain and FishAI</h1>
      <p className="mt-5 text-lg">The best tool depends on your task. Research lakes and regulations with Ontario's official resources, record trips with a logbook, and check conditions before heading out. This is a documentation-based comparison, not a hands-on performance test.</p>
      <p className="mt-3 text-sm text-slate-400">Editorial disclosure: FishAI publishes this guide and appears below. We have not independently measured prediction accuracy, catch improvement, data freshness, or competitors' paid tiers.</p>
      <section className="mt-8 grid sm:grid-cols-3 gap-4" aria-label="Fishing tool comparison">
        <div className={panel}><h2 className="font-bold text-white text-lg">Fish ON-Line</h2><p className="mt-2 text-sm">Ontario's official fishing map describes searches by waterbody, species, stocking and coordinates, with access points and depth contours.</p><a className={link} href={sources.guide} target="_blank" rel="noreferrer">Government guide</a></div>
        <div className={panel}><h2 className="font-bold text-white text-lg">Fishbrain</h2><p className="mt-2 text-sm">Its published logbook documents catches, gear, conditions, private locations and optional community sharing. Features and tiers should be checked directly.</p><a className={link} href="https://fishbrain.com/features/logbook" target="_blank" rel="noreferrer">Vendor documentation</a></div>
        <div className={panel}><h2 className="font-bold text-white text-lg">FishAI</h2><p className="mt-2 text-sm">Explore fishing conditions, personal catch records and the Ontario data lookup below. Check the current app for availability in your location.</p><a className={link} href="/">Open FishAI</a></div>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-white">Explore Ontario open fishing data</h2>
        <p className="mt-2">This beta lookup requests Ontario's separately licensed open datasets, not a scrape of the Fish ON-Line viewer. Search official lake names or access points near a coordinate. A record does not prove fish presence, public entry, launch availability or legal fishing.</p>
        <form onSubmit={search} className={panel + ' mt-5 space-y-4'}>
          <fieldset className="flex gap-4 text-sm">
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
      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-bold text-white">How to decide which app to use</h2>
        <p>Try a waterbody you know. Verify the correct water, information source, freshness and available subscription tier. Test weak-signal access before your trip. For catches, examine export and exact-location privacy settings. For trip conditions, compare forecasts against the actual weather instead of treating a predicted bite score as proof.</p>
        <p>Ontario warns that maps are not legal authority for property access or navigation. Confirm seasonal restrictions, catch limits, sanctuaries and local permissions independently in the <a className={link} href={sources.regs}>current Ontario fishing regulations</a>.</p>
        <h2 className="text-xl font-bold text-white">Sources and reuse notice</h2>
        <p className="text-sm">Contains information licensed under the Open Government Licence - Ontario. FishAI is not affiliated with or endorsed by the Government of Ontario. Data may be incomplete or outdated. No government logos or imagery have been reused.</p>
        <ul className="text-sm space-y-1">
          <li><a className={link} href={sources.lakes}>Geographic Names Ontario dataset</a></li>
          <li><a className={link} href={sources.access}>Fishing Access Points dataset</a></li>
          <li><a className={link} href={sources.licence}>Ontario open data licence</a></li>
          <li><a className={link} href={sources.guide}>Fish ON-Line documentation</a></li>
        </ul>
      </section>
    </article>
  );
}
