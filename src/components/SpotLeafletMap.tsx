import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FishingSpot } from '../types/catchLogTypes';
import { LocateFixed } from 'lucide-react';

interface SpotLeafletMapProps {
  spots: FishingSpot[];
  selectedSpotId: string;
  onSelectSpot: (id: string) => void;
  onPickLocation: (lat: number, lon: number, placeName?: string) => void;
}

// Real interactive map (Leaflet + OpenStreetMap/Carto dark tiles — free, no API key).
// Click anywhere to drop a pin → parent opens the add-spot modal with real coords.
export const SpotLeafletMap: React.FC<SpotLeafletMapProps> = ({
  spots,
  selectedSpotId,
  onSelectSpot,
  onPickLocation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const pickMarkerRef = useRef<L.Marker | null>(null);
  const pickRef = useRef({ lat: 0, lon: 0 });

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [45.0, -90.0],
      zoom: 4,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);

    // Click → reverse geocode (Nominatim, free, 1 req/s) → pick
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      pickRef.current = { lat, lon: lng };
      if (pickMarkerRef.current) pickMarkerRef.current.remove();
      pickMarkerRef.current = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: '<div class="w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-lg animate-ping-once"></div><div class="w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-lg -mt-4"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      }).addTo(map);

      let placeName: string | undefined;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}`,
          { headers: { 'User-Agent': 'FishAI-app/1.0 (fishing spot tracker)' } }
        );
        if (res.ok) {
          const data = await res.json();
          placeName = data?.display_name?.split(',')?.slice(0, 2)?.join(',');
        }
      } catch {
        /* reverse geocode is best-effort */
      }
      onPickLocation(lat, lng, placeName);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onPickLocation]);

  // Sync markers + fit bounds when spots change
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    spots.forEach((spot) => {
      const isSelected = spot.id === selectedSpotId;
      const icon = L.divIcon({
        className: '',
        html: `<div class="spot-pin ${isSelected ? 'spot-pin-active' : ''}">${spot.name
          .slice(0, 1)
          .toUpperCase()}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const marker = L.marker([spot.latitude, spot.longitude], { icon }).addTo(layer);
      marker.bindPopup(
        `<div style="font-family:monospace;font-size:11px;color:#0f172a;">
          <b style="font-size:12px;">${spot.name}</b><br/>
          ${spot.waterBody}<br/>
          <span style="color:#0d9488;">${spot.totalCatches} catches</span>
        </div>`
      );
      marker.on('click', () => onSelectSpot(spot.id));
    });

    if (spots.length > 0) {
      const bounds = L.latLngBounds(spots.map((s) => [s.latitude, s.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [spots, selectedSpotId, onSelectSpot]);

  const handleLocate = () => {
    const map = mapRef.current;
    if (!map) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        map.setView([lat, lon], 14);
        pickRef.current = { lat, lon };
        if (pickMarkerRef.current) pickMarkerRef.current.remove();
        pickMarkerRef.current = L.marker([lat, lon], {
          icon: L.divIcon({
            className: '',
            html: '<div class="w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-lg"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
        }).addTo(map);
        onPickLocation(lat, lon, 'My current location');
      },
      () => {
        /* location denied — user can click the map instead */
      }
    );
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
      {/* Map Toolbar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Interactive Map — click to pin a spot
        </span>
        <button
          onClick={handleLocate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-emerald-500/25 transition-all"
        >
          <LocateFixed className="w-3.5 h-3.5" /> Use my location
        </button>
      </div>

      <div ref={containerRef} className="w-full aspect-16/10 bg-slate-950 z-0" />

      <div className="px-4 py-2.5 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400">
          {spots.length} saved spot{spots.length === 1 ? '' : 's'} • coordinates stored privately on this device
        </span>
        <span className="text-[10px] font-mono text-slate-500">
          OpenStreetMap © contributors
        </span>
      </div>
    </div>
  );
};

export default SpotLeafletMap;
