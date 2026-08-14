import React, { useState } from 'react';
import { Target, Zap, Anchor, Compass, Sparkles, Filter, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LurePreset {
  species: string;
  clarity: 'CLEAR' | 'STAINED' | 'MUDDY';
  depth: 'SHALLOW' | 'MID' | 'DEEP';
  lures: Array<{ name: string; type: string; color: string; action: string }>;
  liveBaits: string[];
  presentation: string;
  gear: string;
}

const TACKLE_DATABASE: Record<string, LurePreset> = {
  'Largemouth Bass-STAINED-SHALLOW': {
    species: 'Largemouth Bass',
    clarity: 'STAINED',
    depth: 'SHALLOW',
    lures: [
      { name: '3/8 oz ChatterBait / Bladed Jig', type: 'Vibrating Jig', color: 'Black & Blue / Chartreuse', action: 'Steady retrieve across shallow weed tops with periodic rod twitches' },
      { name: '5″ Wacky-Rigged Senko', type: 'Soft Plastic Stickbait', color: 'Green Pumpkin / Junebug', action: 'Let sink on slack line to shallow cover, pause 4 seconds' },
      { name: 'Squarebill Crankbait', type: 'Hard Bait', color: 'Firetiger / Bluegill Pattern', action: 'Deflect violently off shallow stump edges and rock piles' },
    ],
    liveBaits: ['Golden Shiners', 'Live Wild Minnows', 'Large Nightcrawlers'],
    presentation: 'Target shallow stump edges, lily pads, and dock pilings. High vibration lures trigger strike reactions in stained water.',
    gear: "7'0″ Medium-Heavy Fast Action Baitcaster with 15lb Fluorocarbon or 30lb Braid",
  },
  'Largemouth Bass-CLEAR-SHALLOW': {
    species: 'Largemouth Bass',
    clarity: 'CLEAR',
    depth: 'SHALLOW',
    lures: [
      { name: 'Topwater Walking Pencil Popper', type: 'Surface Hard Bait', color: 'Bone White / Ghost Minnow', action: 'Rhythmic walk-the-dog twitch on calm early morning surface' },
      { name: '3.5″ Finesse Paddle Swimbait', type: 'Soft Plastic', color: 'Natural Shad / Translucent', action: 'Slow steady burn through clear water columns' },
      { name: 'Drop Shot Rig with 4″ Worm', type: 'Finesse Rig', color: 'Morning Dawn / Green Pumpkin', action: 'Gentle shake of tip while holding lead weight stationary on bottom' },
    ],
    liveBaits: ['Shad', 'Golden Shiners', 'Leeches'],
    presentation: 'Natural stealth presentation with downsized fluorocarbon leaders is critical in high clarity water.',
    gear: "7'2″ Medium Light Spinning Rod with 10lb Braid to 8lb Fluorocarbon Leader",
  },
  'Rainbow Trout-CLEAR-MID': {
    species: 'Rainbow Trout',
    clarity: 'CLEAR',
    depth: 'MID',
    lures: [
      { name: '1/8 oz Gold Panther Martin Spinner', type: 'Inline Spinner', color: 'Gold Blade / Black Body', action: 'Cast cross-current and swing across deep pool current seams' },
      { name: 'Size 14 Parachute Adams Dry Fly', type: 'Dry Fly', color: 'Natural Grey / White Wing', action: 'Dead drift along seam boundaries without line drag' },
      { name: 'Small Floating Rapala Minnow', type: 'Hard Jerkbait', color: 'Rainbow Trout / Silver', action: 'Twitch-twitch-pause along current dropoffs' },
    ],
    liveBaits: ['Salmon Eggs', 'Waxworms', 'Small Red Wigglers'],
    presentation: 'Cast upstream into current seams and allow natural drift through deep eddy pools.',
    gear: "6'6″ Ultra-Light Spinning Rod with 4lb Monofilament Line",
  },
  'Northern Pike-STAINED-MID': {
    species: 'Northern Pike',
    clarity: 'STAINED',
    depth: 'MID',
    lures: [
      { name: '3/4 oz Classic Red & White Spoon', type: 'Casting Spoon', color: 'Red & White Nickel', action: 'Wobbling sweep and flutter drop near weedline dropoffs' },
      { name: '6″ Soft Swimbait on Jighead', type: 'Big Swimbait', color: 'Yellow Perch / Firetail', action: 'Steady heavy thumping retrieve past weed beds' },
      { name: 'Double Willow Blade Spinnerbait', type: 'Heavy Wire Spinnerbait', color: 'Chartreuse & White', action: 'Burn fast across shallow weed flats then kill retrieve' },
    ],
    liveBaits: ['Large Live Suckers', 'Chubs'],
    presentation: 'Erratic burn-and-pause retrieve across shallow weed beds. Always rig with titanium wire leader!',
    gear: "7'6″ Heavy Action Baitcaster with 50lb Braid and 12″ Wire Leader",
  },
};

export const TackleAssistantView: React.FC = () => {
  const [selectedSpecies, setSelectedSpecies] = useState('Largemouth Bass');
  const [selectedClarity, setSelectedClarity] = useState<'CLEAR' | 'STAINED' | 'MUDDY'>('STAINED');
  const [selectedDepth, setSelectedDepth] = useState<'SHALLOW' | 'MID' | 'DEEP'>('SHALLOW');

  const key = `${selectedSpecies}-${selectedClarity}-${selectedDepth}`;
  const preset = TACKLE_DATABASE[key] || TACKLE_DATABASE['Largemouth Bass-STAINED-SHALLOW'];

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-slate-900 border-l-4 border-amber-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded">
              FishAI Tackle Assistant
            </span>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Dynamic Recommendation Engine
            </span>
          </div>
          <h2 className="text-2xl font-display font-black uppercase text-white tracking-tight flex items-center gap-2">
            🎣 Smart Tackle, Lure & Presentation Engine
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Select your target species, water clarity, and depth. FishAI will match optimized artificial lures, live baits, color patterns, and retrieval techniques.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filter Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-white/10 p-5 rounded-xl space-y-4 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Filter className="w-4 h-4 text-amber-400" /> Target Environmental Parameters
            </h3>

            {/* Target Species Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Species:</label>
              <select
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value)}
                className="w-full bg-slate-950 text-white font-mono text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500"
              >
                <option value="Largemouth Bass">Largemouth Bass</option>
                <option value="Rainbow Trout">Rainbow Trout</option>
                <option value="Northern Pike">Northern Pike</option>
                <option value="Red Drum / Redfish">Red Drum / Redfish</option>
              </select>
            </div>

            {/* Water Clarity Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Water Clarity Condition:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['CLEAR', 'STAINED', 'MUDDY'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedClarity(c)}
                    className={`py-2 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all ${
                      selectedClarity === c
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Water Depth Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Column Depth:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['SHALLOW', 'MID', 'DEEP'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDepth(d)}
                    className={`py-2 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all ${
                      selectedDepth === d
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Tackle Output */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Recommended Setup Match
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  {preset.species} ({selectedClarity} Water • {selectedDepth} Depth)
                </h3>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold rounded">
                High Success Rate Match
              </span>
            </div>

            {/* Artificial Lure Cards */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Top Recommended Artificial Lures
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {preset.lures.map((lure, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-amber-400 block font-mono">
                        #{idx + 1} {lure.type}
                      </span>
                      <h5 className="text-sm font-black text-white uppercase leading-tight">
                        {lure.name}
                      </h5>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-900 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Recommended Color Pattern:</span>
                        <span className="text-emerald-300 font-bold">{lure.color}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Retrieval Action:</span>
                        <span className="text-slate-300 text-[11px] leading-relaxed">{lure.action}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Baits */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Anchor className="w-4 h-4 text-blue-400" /> Effective Live Baits
              </h4>
              <div className="flex flex-wrap gap-2">
                {preset.liveBaits.map((b, i) => (
                  <span key={i} className="bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 font-bold">
                    🎣 {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Presentation Strategy & Recommended Gear */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800 font-mono text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-cyan-400" /> Presentation Strategy:
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {preset.presentation}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Rod, Line & Gear Pairing:
                </span>
                <p className="text-emerald-300 font-bold leading-relaxed">
                  {preset.gear}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
