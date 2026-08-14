import React, { useState } from 'react';
import { FishingSpot, CatchLogItem, SpotPrivacyLevel } from '../types/catchLogTypes';
import {
  MapPin,
  Compass,
  PlusCircle,
  Star,
  Waves,
  Anchor,
  CloudSun,
  Layers,
  Sparkles,
  Search,
  BookOpen,
  Lock,
  Users,
  Globe,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { getUserLocation } from '../utils/weather';

interface SpotTrackerMapProps {
  spots: FishingSpot[];
  catches: CatchLogItem[];
  onAddSpot: (spot: Omit<FishingSpot, 'id' | 'totalCatches'>) => void;
  onSelectSpotFilter: (spotName: string) => void;
}

export const SpotTrackerMap: React.FC<SpotTrackerMapProps> = ({
  spots,
  catches,
  onAddSpot,
  onSelectSpotFilter,
}) => {
  const [selectedSpotId, setSelectedSpotId] = useState<string>(spots[0]?.id || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New Spot Form State
  const [newSpotName, setNewSpotName] = useState('');
  const [newWaterBody, setNewWaterBody] = useState('');
  const [newTopSpecies, setNewTopSpecies] = useState('Largemouth Bass');
  const [newBestBait, setNewBestBait] = useState('Wacky Senko');
  const [newClarity, setNewClarity] = useState<'CLEAR' | 'STAINED' | 'MUDDY'>('STAINED');
  const [newDepth, setNewDepth] = useState(8);
  const [newNotes, setNewNotes] = useState('');
  const [newPrivacy, setNewPrivacy] = useState<SpotPrivacyLevel>('PRIVATE');
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const activeSpot = spots.find((s) => s.id === selectedSpotId) || spots[0];

  const catchesAtActiveSpot = catches.filter(
    (c) => c.locationName.toLowerCase().includes(activeSpot?.name.toLowerCase() || '') ||
           activeSpot?.name.toLowerCase().includes(c.locationName.toLowerCase() || '')
  );

  // Render-only: most recent catch date per spot (for the quick-selector cards)
  const lastFishedBySpot: Record<string, string> = {};
  spots.forEach((spot) => {
    const spotCatches = catches
      .filter(
        (c) =>
          c.locationName.toLowerCase().includes(spot.name.toLowerCase()) ||
          spot.name.toLowerCase().includes(c.locationName.toLowerCase())
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (spotCatches.length > 0) {
      lastFishedBySpot[spot.id] = (spotCatches[0].formattedDate.split('•')[0] || spotCatches[0].formattedDate).trim();
    }
  });

  // Real GPS coordinates from the browser — never random fabricated coords.
  const handleCreateSpot = async () => {
    if (!newSpotName) return;
    setPrivacyError(null);
    setIsCreating(true);

    let lat: number | null = null;
    let lon: number | null = null;
    const loc = await getUserLocation();
    if (loc) {
      lat = loc.latitude;
      lon = loc.longitude;
    }

    if (lat === null || lon === null) {
      setPrivacyError('Could not get your GPS position. Allow browser location access to tag a real spot — spots are never saved at made-up coordinates.');
      setIsCreating(false);
      return;
    }

    onAddSpot({
      name: newSpotName,
      waterBody: newWaterBody || 'Local Lake',
      latitude: lat,
      longitude: lon,
      rating: 5.0,
      topSpecies: newTopSpecies,
      bestBait: newBestBait,
      waterClarity: newClarity,
      averageDepthFeet: newDepth,
      notes: newNotes || 'Newly added spot.',
      privacyLevel: newPrivacy,
    });

    setIsAddModalOpen(false);
    setNewSpotName('');
    setNewNotes('');
    setIsCreating(false);
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-slate-900 border-l-4 border-cyan-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-cyan-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded">
              FishAI Spot Tracker & Map
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> GPS Coordinates & Depth Active
            </span>
          </div>
          <h2 className="text-2xl font-display font-black uppercase text-white tracking-tight flex items-center gap-2">
            🗺️ Interactive Fishing Location & Spot Intelligence
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Visualize your top productive fishing spots, review historical catch patterns per water body, track water clarity, and tag new GPS hotspots.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg shadow-lg flex items-center gap-2 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Fishing Spot</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Map Simulation & Pinned Spot Cards */}
        <div className="lg:col-span-7 space-y-4">
          {/* Privacy banner — your spots, your data, your edge */}
          <div className="bg-slate-900 border-l-4 border-emerald-500 border-y border-r border-white/10 rounded-xl p-4 shadow-xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black uppercase text-white tracking-tight">
                100% Private. You Own Your Data.
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Private location intelligence built from your fishing history. We don't sell your data. Ever.
              </p>
            </div>
          </div>

          {/* Simulated Map View Canvas */}
          <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
            {/* Map Header Toolbar */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> Satellite & Topo Depth Overlay
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {spots.length} saved spot{spots.length === 1 ? '' : 's'} • coordinates stored privately on this device
              </span>
            </div>

            {/* Visual Map Canvas Grid */}
            <div className="relative aspect-16/10 bg-slate-950 overflow-hidden flex items-center justify-center">
              {/* Tactical Water Grid Visual */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

              {/* Water Body Shape (Stylized Graphic) */}
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 800 500">
                <path
                  d="M100,200 Q250,50 450,150 T700,300 Q600,450 350,400 T100,200 Z"
                  fill="#0284c7"
                  stroke="#38bdf8"
                  strokeWidth="3"
                />
                <path
                  d="M200,250 Q300,120 500,200 T650,350 Q550,420 300,350 Z"
                  fill="#0369a1"
                />
              </svg>

              {/* Pinned Spot Markers */}
              {spots.map((spot, index) => {
                const isSelected = spot.id === selectedSpotId;
                // Pre-calculated relative map coordinates
                const mapPositions = [
                  { top: '38%', left: '42%' },
                  { top: '25%', left: '68%' },
                  { top: '65%', left: '30%' },
                  { top: '55%', left: '75%' },
                ];
                const pos = mapPositions[index % mapPositions.length];

                return (
                  <div
                    key={spot.id}
                    onClick={() => setSelectedSpotId(spot.id)}
                    style={{ top: pos.top, left: pos.left }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all z-20`}
                  >
                    <div
                      className={`relative flex items-center gap-2 p-2 rounded-full border shadow-2xl transition-all ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 border-white ring-4 ring-cyan-500/40 scale-110'
                          : 'bg-slate-900/90 text-white border-slate-700 hover:border-cyan-400'
                      }`}
                    >
                      <MapPin className={`w-5 h-5 ${isSelected ? 'text-slate-950 animate-bounce' : 'text-cyan-400'}`} />
                      <span className="text-xs font-black uppercase tracking-wider pr-1 hidden sm:inline">
                        {spot.name}
                      </span>
                    </div>

                    {/* Popup Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 border border-slate-700 px-3 py-1.5 rounded shadow-xl whitespace-nowrap z-30 pointer-events-none">
                      <span className="text-[10px] font-bold text-white font-mono block">
                        {spot.name} • {spot.waterBody}
                      </span>
                      <span className="text-[9px] text-cyan-400 font-mono">
                        {spot.totalCatches} Catches Logged
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spot Quick Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {spots.map((spot) => (
              <button
                key={spot.id}
                onClick={() => setSelectedSpotId(spot.id)}
                className={`p-4 rounded-xl border text-left transition-all shadow-lg space-y-2 ${
                  spot.id === selectedSpotId
                    ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/60 border-white/10 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    {spot.waterBody}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" /> {spot.rating}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight truncate flex items-center gap-1.5">
                  <span className="truncate">{spot.name}</span>
                  {spot.privacyLevel === 'PRIVATE' && <Lock className="w-3 h-3 text-emerald-400 shrink-0" />}
                  {spot.privacyLevel === 'FRIENDS' && <Users className="w-3 h-3 text-blue-400 shrink-0" />}
                  {spot.privacyLevel === 'APPROXIMATE' && <EyeOff className="w-3 h-3 text-amber-400 shrink-0" />}
                  {spot.privacyLevel === 'PUBLIC' && <Globe className="w-3 h-3 text-red-400 shrink-0" />}
                </h4>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  {lastFishedBySpot[spot.id] ? `Last fished ${lastFishedBySpot[spot.id]}` : 'Never fished'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {spot.totalCatches} catches • {spot.averageDepthFeet} ft depth
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Detailed Active Spot Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          {activeSpot && (
            <div className="bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-5">
              {/* Spot Title Card */}
              <div className="border-b border-slate-800 pb-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold uppercase rounded border border-cyan-500/30">
                    Active Spot Inspection
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    GPS: {activeSpot.latitude.toFixed(4)}° N, {Math.abs(activeSpot.longitude).toFixed(4)}° W
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-black uppercase font-mono px-1.5 py-0.5 rounded border ${
                    activeSpot.privacyLevel === 'PRIVATE' ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
                    : activeSpot.privacyLevel === 'FRIENDS' ? 'text-blue-300 border-blue-500/40 bg-blue-500/10'
                    : activeSpot.privacyLevel === 'APPROXIMATE' ? 'text-amber-300 border-amber-500/40 bg-amber-500/10'
                    : 'text-red-300 border-red-500/40 bg-red-500/10'
                  }">
                    {activeSpot.privacyLevel === 'PRIVATE' ? '🔒 Private' : activeSpot.privacyLevel === 'FRIENDS' ? '👥 Friends' : activeSpot.privacyLevel === 'APPROXIMATE' ? '👁️ Approximate' : '🌍 Public'}
                  </span>
                </div>

                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-400" /> {activeSpot.name}
                </h3>
                <span className="text-xs text-slate-400 font-mono block">
                  Location Water Body: {activeSpot.waterBody}
                </span>
              </div>

              {/* Spot Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Top Species</span>
                  <span className="text-sm font-black text-emerald-400 truncate block">
                    {activeSpot.topSpecies}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Best Lure / Bait</span>
                  <span className="text-sm font-black text-amber-400 truncate block">
                    {activeSpot.bestBait}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Water Clarity</span>
                  <span className="text-xs font-bold text-cyan-300 uppercase">
                    {activeSpot.waterClarity} Water
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Structure Depth</span>
                  <span className="text-xs font-bold text-white">
                    {activeSpot.averageDepthFeet} Feet
                  </span>
                </div>
              </div>

              {/* Spot Notes */}
              <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1 font-mono text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tactical Angler Notes</span>
                <p className="text-slate-300 leading-relaxed italic">
                  "{activeSpot.notes}"
                </p>
              </div>

              {/* Catches Logged at Spot */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-cyan-400" /> Logged Catches at {activeSpot.name}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {catchesAtActiveSpot.length} Record(s)
                  </span>
                </div>

                {catchesAtActiveSpot.length === 0 ? (
                  <div className="bg-slate-950 p-4 rounded text-center text-xs font-mono text-slate-500">
                    No logged catches linked to this spot name yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {catchesAtActiveSpot.map((item) => (
                      <div key={item.id} className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          {item.photoUrl ? (
                            <img src={item.photoUrl} alt={item.species} className="w-9 h-9 object-cover rounded border border-slate-700 shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded border border-slate-700 bg-slate-900 flex items-center justify-center shrink-0">
                              <Waves className="w-4 h-4 text-slate-600" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-white block">{item.species.split('(')[0]}</span>
                            <span className="text-[10px] text-slate-400">{item.estimatedLength} • {item.baitUsed}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-400 shrink-0">{item.formattedDate.split('•')[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Spot Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" /> Tag New Fishing Spot
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white text-sm font-mono font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase text-slate-400">Spot Name:</label>
                <input
                  type="text"
                  value={newSpotName}
                  onChange={(e) => setNewSpotName(e.target.value)}
                  placeholder="e.g. Cedar Cove Dropoff"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-slate-400">Water Body / Lake Name:</label>
                <input
                  type="text"
                  value={newWaterBody}
                  onChange={(e) => setNewWaterBody(e.target.value)}
                  placeholder="e.g. Cypress Reservoir"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-400">Top Target Species:</label>
                  <input
                    type="text"
                    value={newTopSpecies}
                    onChange={(e) => setNewTopSpecies(e.target.value)}
                    placeholder="e.g. Largemouth Bass"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-400">Best Bait / Lure:</label>
                  <input
                    type="text"
                    value={newBestBait}
                    onChange={(e) => setNewBestBait(e.target.value)}
                    placeholder="e.g. Spinnerbait"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-400">Water Clarity:</label>
                  <select
                    value={newClarity}
                    onChange={(e) => setNewClarity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none"
                  >
                    <option value="CLEAR">Clear</option>
                    <option value="STAINED">Stained</option>
                    <option value="MUDDY">Muddy</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-400">Average Depth (ft):</label>
                  <input
                    type="number"
                    value={newDepth}
                    onChange={(e) => setNewDepth(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-slate-400">Spot Notes & Structure Description:</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Shallow grass line adjacent to 15ft channel."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold uppercase text-slate-400">Spot Privacy:</label>
                <select
                  value={newPrivacy}
                  onChange={(e) => setNewPrivacy(e.target.value as SpotPrivacyLevel)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none"
                >
                  <option value="PRIVATE">🔒 Private — exact location, only on this device</option>
                  <option value="FRIENDS">👥 Friends — shared with anglers you choose (future)</option>
                  <option value="APPROXIMATE">👁️ Approximate — general area, exact spot hidden</option>
                  <option value="PUBLIC">🌍 Public — visible to everyone (use with care)</option>
                </select>
                <p className="text-[10px] text-slate-500 font-mono">
                  Your exact coordinates are never shared anywhere unless you pick Public.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-300 space-y-1">
                <span className="text-[10px] uppercase font-bold text-cyan-400 block">GPS Capture</span>
                <span>
                  Saving uses your real GPS position from this device.
                </span>
              </div>

              {privacyError && (
                <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl text-red-300 text-[11px] font-mono">
                  {privacyError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs uppercase rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleCreateSpot}
                disabled={isCreating}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2"
              >
                {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isCreating ? 'Getting GPS...' : 'Save Spot Marker'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
