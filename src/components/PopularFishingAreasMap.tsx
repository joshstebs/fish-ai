import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink, Loader2, MapPinned } from 'lucide-react';

type Region = 'ontario' | 'us';
const ONTARIO_SERVICE = 'https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open07/MapServer';
const USGS_SERVICE = 'https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer';
const US_AREAS = [
  { name: 'Lake Okeechobee', detail: 'Florida · largemouth bass, crappie', lat: 26.96, lon: -80.82, href: 'https://myfwc.com/fishing/freshwater/sites-forecasts/s/lake-okeechobee/', agency: 'Florida Fish and Wildlife Conservation Commission' },
  { name: 'Lake Fork', detail: 'Texas · bass, crappie, catfish', lat: 32.86, lon: -95.57, href: 'https://tpwd.texas.gov/fishboat/fish/recreational/lakes/fork/', agency: 'Texas Parks and Wildlife Department' },
  { name: 'Lake Guntersville', detail: 'Alabama · bass, crappie, sauger', lat: 34.42, lon: -86.28, href: 'https://www.outdooralabama.com/reservoirs/lake-guntersville', agency: 'Alabama Department of Conservation and Natural Resources' },
  { name: 'Illinois shoreline, Lake Michigan', detail: 'Illinois · salmon, trout, perch', lat: 41.89, lon: -87.58, href: 'https://dnr.illinois.gov/education/cdhabitatmain/cdhabitatlakemichigan.html', agency: 'Illinois Department of Natural Resources' },
  { name: 'Mille Lacs Lake', detail: 'Minnesota · walleye, bass, northern pike', lat: 46.17, lon: -93.62, href: 'https://www.dnr.state.mn.us/fishing/millelacs.html', agency: 'Minnesota Department of Natural Resources' },
  { name: 'Lake of the Woods', detail: 'Minnesota · walleye, pike, sturgeon, sauger', lat: 49.0, lon: -94.8, href: 'https://www.dnr.state.mn.us/lakeofthewoods/index.html', agency: 'Minnesota Department of Natural Resources' },
  { name: 'Lake Champlain', detail: 'Vermont and New York · smallmouth and largemouth bass', lat: 44.55, lon: -73.25, href: 'https://www.vtfishandwildlife.com/fish/fishing-opportunities/spring-catch-and-release-bass-fishing', agency: 'Vermont Fish & Wildlife Department' },
  { name: 'Kenai River', detail: 'Alaska · salmon, rainbow trout', lat: 60.49, lon: -151.07, href: 'https://www.adfg.alaska.gov/index.cfm?adfg=ByAreaSouthcentralUpperKenai.fishingInfo', agency: 'Alaska Department of Fish and Game' },
  { name: 'Columbia River', detail: 'Oregon and Washington · salmon and steelhead', lat: 45.65, lon: -121.94, href: 'https://myodfw.com/recreation-report/fishing-report/columbia-zone', agency: 'Oregon Department of Fish and Wildlife' },
];
const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

export const PopularFishingAreasMap: React.FC = () => {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const features = useRef<L.LayerGroup | null>(null);
  const [region, setRegion] = useState<Region>('ontario');
  const [showRivers, setShowRivers] = useState(true);
  const [showLakes, setShowLakes] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = L.map(container.current, { center: [44.2, -79.5], zoom: 6 });
    mapRef.current = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);
    features.current = L.layerGroup().addTo(map);
    return () => { map.remove(); mapRef.current = null; features.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = features.current;
    if (!map || !layer) return;
    layer.clearLayers();
    setError('');
    setLoading(false);
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let alive = true;

    const load = async () => {
      if (!alive) return;
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      const b = map.getBounds();
      const geometry = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(',');
      const common = {
        geometry, geometryType: 'esriGeometryEnvelope', inSR: '4326', outSR: '4326',
        spatialRel: 'esriSpatialRelIntersects', returnGeometry: 'true', f: 'geojson',
      };
      const query = (where: string, fields: string, count: number) => new URLSearchParams({
        ...common, where, outFields: fields, resultRecordCount: String(count),
      }).toString();
      setLoading(true);
      try {
        if (region === 'ontario') {
          const params = query('1=1', '*', 500);
          const [waterRes, riverRes, accessRes] = await Promise.all([
            fetch(ONTARIO_SERVICE + '/2/query?' + params, { signal }),
            fetch(ONTARIO_SERVICE + '/1/query?' + params, { signal }),
            fetch(ONTARIO_SERVICE + '/15/query?' + params, { signal }),
          ]);
          if (!waterRes.ok || !riverRes.ok || !accessRes.ok) throw new Error('Ontario open data is temporarily unavailable.');
          const [water, rivers, access] = await Promise.all([waterRes.json(), riverRes.json(), accessRes.json()]);
          if (!alive || signal.aborted) return;
          if (water.features) L.geoJSON(water, {
            style: { color: '#41d9c0', weight: 1, opacity: 0.8, fillColor: '#168f86', fillOpacity: 0.18 },
            onEachFeature: (feature, item) => {
              const p = feature.properties || {};
              item.bindPopup('<b>' + escapeHtml(p.OFFICIAL_WATERBODY_NAME || p.CORPORATE_WATERBODY_NAME || 'Ontario waterbody') + '</b><br>' + escapeHtml(p.WATERBODY_TYPE || 'Lake or river') + '<br>Ontario Fish ON-Line open data');
            },
          }).addTo(layer);
          if (rivers.features) L.geoJSON(rivers, {
            style: { color: '#73b8ff', weight: 2, opacity: 0.9 },
            onEachFeature: (feature, item) => {
              const p = feature.properties || {};
              item.bindPopup('<b>' + escapeHtml(p.OFFICIAL_WATERBODY_NAME || p.CORPORATE_WATERBODY_NAME || 'Ontario river or stream') + '</b><br>River or stream · Ontario Fish ON-Line open data');
            },
          }).addTo(layer);
          if (access.features) L.geoJSON(access, {
            pointToLayer: (_f, latlng) => L.circleMarker(latlng, { radius: 4, color: '#06211d', weight: 1, fillColor: '#fbbf24', fillOpacity: 0.95 }),
            onEachFeature: (feature, item) => {
              const p = feature.properties || {};
              item.bindPopup('<b>' + escapeHtml(p.ACCESS_POINT_NAME || p.NAME || p.DESCRIPTION || 'Fishing access point') + '</b><br>Public fishing access · Ontario open data');
            },
          }).addTo(layer);
        } else {
          US_AREAS.forEach(area => {
            L.circleMarker([area.lat, area.lon], { radius: 8, color: '#07110f', weight: 2, fillColor: '#34d399', fillOpacity: 0.95 })
              .bindPopup('<b>' + escapeHtml(area.name) + '</b><br>' + escapeHtml(area.detail) + '<br><a target="_blank" rel="noopener noreferrer" href="' + escapeHtml(area.href) + '">Source: ' + escapeHtml(area.agency) + '</a>')
              .addTo(layer);
          });
          if (map.getZoom() < 7) return;
          const requests: Promise<Response>[] = [];
          if (showRivers) requests.push(fetch(USGS_SERVICE + '/6/query?' + query('GNIS_NAME IS NOT NULL', 'GNIS_NAME,FTYPE,FCODE', 250), { signal }));
          if (showLakes) requests.push(fetch(USGS_SERVICE + '/12/query?' + query('GNIS_NAME IS NOT NULL', 'GNIS_NAME,FTYPE,FCODE', 250), { signal }));
          const responses = await Promise.all(requests);
          if (responses.some(response => !response.ok)) throw new Error('USGS water features are temporarily unavailable.');
          const collections = await Promise.all(responses.map(response => response.json()));
          if (!alive || signal.aborted) return;
          let collectionIndex = 0;
          if (showRivers) {
            const rivers = collections[collectionIndex++];
            if (rivers.features) L.geoJSON(rivers, {
              style: { color: '#73b8ff', weight: 2, opacity: 0.88 },
              onEachFeature: (feature, item) => item.bindPopup('<b>' + escapeHtml(feature.properties?.GNIS_NAME || 'U.S. river or stream') + '</b><br>USGS National Hydrography Dataset'),
            }).addTo(layer);
          }
          if (showLakes) {
            const lakes = collections[collectionIndex];
            if (lakes.features) L.geoJSON(lakes, {
              style: { color: '#41d9c0', weight: 1, opacity: 0.85, fillColor: '#168f86', fillOpacity: 0.18 },
              onEachFeature: (feature, item) => item.bindPopup('<b>' + escapeHtml(feature.properties?.GNIS_NAME || 'U.S. lake or reservoir') + '</b><br>USGS National Hydrography Dataset'),
            }).addTo(layer);
          }
        }
      } catch (e) {
        if (alive && !signal.aborted) setError(e instanceof Error ? e.message : 'Could not load map data.');
      } finally {
        if (alive && !signal.aborted) setLoading(false);
      }
    };
    const schedule = () => { if (timer) clearTimeout(timer); timer = setTimeout(load, 350); };
    if (region === 'ontario') map.setView([44.2, -79.5], 6);
    else map.setView([39.1, -96.2], 4);
    schedule();
    map.on('moveend', schedule);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      controller?.abort();
      map.off('moveend', schedule);
    };
  }, [region, showRivers, showLakes]);

  return <section className="max-w-6xl mx-auto">
    <div className="mb-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2"><MapPinned className="w-4 h-4" /> Explore fishing areas</p>
      <h2 className="headline mt-2 text-3xl sm:text-5xl">Find water worth exploring</h2>
      <p className="mt-3 max-w-3xl text-sm text-slate-300">Browse Ontario lakes, rivers, streams and fishing access, or explore U.S. rivers and lakes with agency-linked featured fisheries. Featured does not mean a live bite report or a catch-rate ranking.</p>
    </div>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900 p-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Map region">
        <button onClick={() => setRegion('ontario')} aria-pressed={region === 'ontario'} className={region === 'ontario' ? 'rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-950' : 'rounded-lg bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-300'}>Ontario</button>
        <button onClick={() => setRegion('us')} aria-pressed={region === 'us'} className={region === 'us' ? 'rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-950' : 'rounded-lg bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-300'}>United States</button>
      </div>
      {region === 'us' && <div className="flex gap-3 text-xs text-slate-300" role="group" aria-label="U.S. map layers">
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={showRivers} onChange={e => setShowRivers(e.target.checked)} /> Rivers</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={showLakes} onChange={e => setShowLakes(e.target.checked)} /> Lakes</label>
      </div>}
      <span className="flex items-center gap-2 text-[11px] text-slate-400">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading map data…</> : region === 'us' ? 'Zoom to level 7+ to load visible U.S. waters' : 'Move or zoom the map to load nearby data'}</span>
    </div>
    {error && <p role="status" className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">{error}</p>}
    <div ref={container} className="h-[62vh] min-h-[420px] w-full rounded-2xl border border-white/10 bg-slate-950" />
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-slate-900 p-4 text-xs text-slate-300">
        <p className="font-black uppercase tracking-wider text-emerald-400">Ontario data</p>
        <p className="mt-1">Fish ON-Line waterbody boundaries, rivers and public access points load from Ontario’s live open GIS service for the visible area.</p>
        <a className="mt-2 inline-flex items-center gap-1 text-emerald-300 hover:text-white" href="https://www.ontario.ca/page/how-use-fish-line" target="_blank" rel="noreferrer">Fish ON-Line details <ExternalLink className="h-3 w-3" /></a>
        <span className="mx-2 text-slate-500">·</span><a className="inline-flex items-center gap-1 text-emerald-300 hover:text-white" href="https://data.ontario.ca/dataset/fish-on-line" target="_blank" rel="noreferrer">Ontario datasets <ExternalLink className="h-3 w-3" /></a>
      </div>
      <div className="rounded-xl border border-white/10 bg-slate-900 p-4 text-xs text-slate-300">
        <p className="font-black uppercase tracking-wider text-emerald-400">U.S. map data</p>
        <p className="mt-1">USGS National Hydrography Dataset rivers and lakes load for the current map area after zooming in. Featured fisheries are curated links to state fish and wildlife agencies, not live catch forecasts.</p>
        <a className="mt-2 inline-flex items-center gap-1 text-emerald-300 hover:text-white" href="https://www.usgs.gov/national-hydrography" target="_blank" rel="noreferrer">USGS National Hydrography <ExternalLink className="h-3 w-3" /></a>
        <span className="mx-2 text-slate-500">·</span><a className="inline-flex items-center gap-1 text-emerald-300 hover:text-white" href="https://www.usgs.gov/tools/us-inland-creel-and-angler-survey-catalog-creelcat" target="_blank" rel="noreferrer">USGS CreelCat survey catalog <ExternalLink className="h-3 w-3" /></a>
      </div>
    </div>
  </section>;
};
export default PopularFishingAreasMap;
