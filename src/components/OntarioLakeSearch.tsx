import React, { useEffect, useRef, useState } from 'react';

type Lake = { name: string; kind: string; lat: number; lon: number };
export default function OntarioLakeSearch({ onSelect }: { onSelect: (lat: number, lon: number) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Lake[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);
  async function search(e: React.FormEvent) {
    e.preventDefault();
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), 12000);
    setLoading(true); setResults([]); setStatus('');
    try {
      const response = await fetch('/api/ontario-data?mode=lakes&q=' + encodeURIComponent(query.trim()), { signal: controller.signal });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.items)) throw new Error(data.error || 'Lake search unavailable');
      if (request.current !== controller) return;
      const lakes = data.items.filter((lake: Lake) => typeof lake.lat === 'number' && typeof lake.lon === 'number' && Number.isFinite(lake.lat) && Number.isFinite(lake.lon) && lake.lat >= 41 && lake.lat <= 57 && lake.lon >= -96 && lake.lon <= -74);
      setResults(lakes);
      setStatus(lakes.length ? (data.truncated ? 'Showing up to 40 matches. Refine the name for more specific results.' : 'Choose a lake to centre the map.') : 'No matching Ontario lakes found. Try a shorter name.');
    } catch (error) {
      if (request.current === controller) setStatus(controller.signal.aborted ? 'Search timed out. Try again.' : error instanceof Error ? error.message : 'Lake search unavailable. Try again.');
    } finally {
      clearTimeout(timer);
      if (request.current === controller) setLoading(false);
    }
  }
  return <div className="mb-3 rounded-xl border border-white/10 bg-slate-900 p-3">
    <form onSubmit={search} className="flex flex-wrap items-end gap-2">
      <label className="flex-1 text-xs text-slate-300">Search official Ontario lake names
        <input value={query} onChange={e => setQuery(e.target.value)} minLength={2} maxLength={50} required pattern="[a-zA-Z0-9 '\-]{2,50}" placeholder="Lake Simcoe" className="mt-1 block w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-sm text-white" />
      </label>
      <button disabled={loading} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">{loading ? 'Searching…' : 'Find lake'}</button>
    </form>
    {status && <p role="status" className="mt-2 text-xs text-slate-300">{status}</p>}
    {results.length > 0 && <ul className="mt-2 max-h-48 overflow-auto text-sm">{results.map((lake, i) => <li key={lake.name + i}><button onClick={() => onSelect(lake.lat, lake.lon)} className="w-full rounded px-2 py-2 text-left text-emerald-300 hover:bg-white/5">{lake.name} · {lake.lat.toFixed(3)}, {lake.lon.toFixed(3)}</button></li>)}</ul>}
    <p className="mt-2 text-[11px] text-slate-400">Ontario Geographic Names, Open Government Licence. Locations identify waterbodies, not launch sites or legal access.</p>
  </div>;
}
