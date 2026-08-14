import React, { useState } from 'react';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  Anchor,
  Compass,
  Target,
  FileText,
  Video,
  Award,
} from 'lucide-react';

interface KnotGuide {
  id: string;
  name: string;
  strength: string;
  bestForLine: string;
  difficulty: 'EASY' | 'MEDIUM' | 'ADVANCED';
  summary: string;
  videoEmbedUrl: string;
  steps: string[];
  proTip: string;
}

const KNOTS_DATA: KnotGuide[] = [
  {
    id: 'palomar',
    name: 'Palomar Knot',
    strength: '95% - 100% (Strongest Overall)',
    bestForLine: 'Braid, Monofilament & Fluorocarbon',
    difficulty: 'EASY',
    summary: 'The gold standard fishing knot. Exceptionally strong, almost impossible to slip, and very easy to tie.',
    videoEmbedUrl: 'https://www.youtube.com/embed/TFk_Ktw2f1w',
    steps: [
      'Double about 6 inches of line and pass the loop through the eye of the hook or lure.',
      'Tie a simple overhand knot with the doubled line, leaving the hook hanging in the loop.',
      'Pass the loop over the entire hook or lure body.',
      'Moisten the line with water/saliva, pull both tag end and main line to tighten securely, then trim the tag end.',
    ],
    proTip: 'Always moisten the knot before pulling tight to prevent friction heat from weakening fluorocarbon line.',
  },
  {
    id: 'clinch',
    name: 'Improved Clinch Knot',
    strength: '90% - 95%',
    bestForLine: 'Monofilament & Fluorocarbon (Light to Medium test)',
    difficulty: 'EASY',
    summary: 'The classic angler knot for tying hooks, swivels, and lures to monofilament or fluorocarbon leader.',
    videoEmbedUrl: 'https://www.youtube.com/embed/fXWRZe784QU',
    steps: [
      'Thread the line through the hook eye, leaving 5-6 inches of tag line.',
      'Wrap the tag end around the standing line 5 to 7 times.',
      'Pass the tag end through the small loop right next to the hook eye.',
      'Pass the tag end back through the large loop you just created.',
      'Moisten line and pull standing line to cinch down tight against the eye.',
    ],
    proTip: 'Not recommended for slippery slick braided line (use Palomar or Uni Knot for braid instead).',
  },
  {
    id: 'uni-knot',
    name: 'Uni Knot (Universal Knot)',
    strength: '90% - 95%',
    bestForLine: 'All Line Types (Braid, Mono, Fluoro)',
    difficulty: 'MEDIUM',
    summary: 'Versatile multi-purpose knot. Can tie lures, hooks, spool line on reels, or join two lines together.',
    videoEmbedUrl: 'https://www.youtube.com/embed/-xubtzqhXUA',
    steps: [
      'Run 6 inches of line through the eye and fold it back parallel to the main line.',
      'Bring the tag end back to form a loop over the double line.',
      'Wrap the tag end around both lines inside the loop 5 to 6 times.',
      'Moisten and pull the tag end to tighten turns, then slide the knot down to the eye.',
    ],
    proTip: 'Mastering the Uni Knot allows you to tie almost anything in fishing, including spool arbor knots.',
  },
  {
    id: 'non-slip-loop',
    name: 'Non-Slip Loop Knot',
    strength: '90%',
    bestForLine: 'Monofilament & Fluorocarbon Leaders',
    difficulty: 'MEDIUM',
    summary: 'Creates a fixed loop that allows crankbaits, topwaters, and swimbaits to swing freely with maximum action.',
    videoEmbedUrl: 'https://www.youtube.com/embed/fP4JToqRh-A',
    steps: [
      'Tie an overhand knot in the line 2 inches above the tag end, but do not pull it tight.',
      'Pass the tag end through the lure eye and back through the overhand knot loop.',
      'Wrap the tag end around the main standing line 4 to 5 times.',
      'Pass the tag end back through the overhand knot loop in the same direction it entered.',
      'Moisten line and pull standing line to form a neat, non-slipping loop.',
    ],
    proTip: 'Gives hard lures 30% more erratic swimming action compared to tight cinch knots.',
  },
];

interface LureGuide {
  name: string;
  category: string;
  bestForSpecies: string[];
  waterDepth: string;
  technique: string;
  beginnerTip: string;
  image: string;
}

const LURES_DATA: LureGuide[] = [
  {
    name: 'Soft Plastic Stickbait (Senko)',
    category: 'Soft Plastics',
    bestForSpecies: ['Largemouth Bass', 'Smallmouth Bass'],
    waterDepth: 'Shallow to Mid-Water (1-10 ft)',
    technique: 'Wacky Rig (hook in middle) or Texas Rig (weedless). Let sink on slack line.',
    beginnerTip: '#1 most productive bass lure worldwide. Do not shake it—just let it fall naturally.',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Squarebill Crankbait',
    category: 'Hard Baits',
    bestForSpecies: ['Largemouth Bass', 'Walleye', 'Pike'],
    waterDepth: 'Shallow Cover (2-6 ft)',
    technique: 'Reel steady and bounce/deflect off shallow rocks, stumps, and dock posts.',
    beginnerTip: 'Strikes happen immediately after the crankbait deflects off an underwater obstacle.',
    image: 'https://images.unsplash.com/photo-1534043464124-3be32fe000c9?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Inline Spinner (Panther Martin / Rooster Tail)',
    category: 'Spinners & Spoons',
    bestForSpecies: ['Rainbow Trout', 'Panfish', 'Smallmouth Bass'],
    waterDepth: 'All Depths (2-8 ft)',
    technique: 'Cast across current or open water, reel at medium speed to spin blade.',
    beginnerTip: 'Ideal for trout streams and small ponds. Easiest lure for absolute beginners to catch fish on.',
    image: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Topwater Popper',
    category: 'Topwater',
    bestForSpecies: ['Largemouth Bass', 'Redfish', 'Pike'],
    waterDepth: 'Surface (0 ft)',
    technique: 'Twitch rod tip to pop water on surface, pause 3 seconds, repeat.',
    beginnerTip: 'Best fished at dawn or dusk near weedlines. Wait until you feel weight before setting hook!',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
  },
];

export const BeginnerGuideView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'KNOTS' | 'LURES' | 'LINES' | 'RODS' | 'CASTING'>('KNOTS');
  const [selectedKnotId, setSelectedKnotId] = useState<string>('palomar');

  const selectedKnot = KNOTS_DATA.find((k) => k.id === selectedKnotId) || KNOTS_DATA[0];

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-slate-900 border-l-4 border-emerald-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded">
              FishAI Angler Academy
            </span>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> Beginner Masterclass Series
            </span>
          </div>
          <h2 className="text-2xl font-display font-black uppercase text-white tracking-tight flex items-center gap-2">
            🎓 Complete Beginner Fishing Guide & Masterclass
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Master essential knot tying, understand fishing line setups, choose the right rod & reel combo, explore top lures, and learn casting techniques.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-2 border border-white/10 rounded-xl shadow-lg">
        {[
          { id: 'KNOTS', label: '🪢 Essential Knots', desc: 'Tie Lures & Hooks' },
          { id: 'LURES', label: '🎣 Lures & Baits', desc: 'Lure Selection' },
          { id: 'LINES', label: '🧵 Line & Rigging', desc: 'Mono vs Fluoro vs Braid' },
          { id: 'RODS', label: '🎣 Rods & Reels', desc: 'Spinning vs Baitcaster' },
          { id: 'CASTING', label: '🎯 Casting Guide', desc: 'Overhead & Sidearm' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 flex-1 min-w-[140px] justify-center ${
              activeSection === tab.id
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg font-black'
                : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SECTION 1: KNOT TYING GUIDE */}
      {activeSection === 'KNOTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Knot Selector */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" /> Select Fishing Knot:
            </h3>

            {KNOTS_DATA.map((knot) => (
              <button
                key={knot.id}
                onClick={() => setSelectedKnotId(knot.id)}
                className={`w-full p-4 rounded-xl border text-left transition-all shadow-lg space-y-2 ${
                  knot.id === selectedKnotId
                    ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/60 border-white/10 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    {knot.difficulty} • {knot.strength}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight">
                  {knot.name}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono line-clamp-2 leading-relaxed">
                  {knot.summary}
                </p>
              </button>
            ))}
          </div>

          {/* Right Column: Selected Knot Instructions & Video Embed */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-900 border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
              {/* Header Badge */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Knot Tutorial Details
                  </span>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                    {selectedKnot.name}
                  </h3>
                </div>
                <div className="bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
                  <span className="text-slate-400">Strength: </span>
                  <span className="text-emerald-400 font-bold">{selectedKnot.strength}</span>
                </div>
              </div>

              {/* Video Embed Frame */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-emerald-400" /> Video Demonstration:
                </span>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
                  <iframe
                    src={selectedKnot.videoEmbedUrl}
                    title={`${selectedKnot.name} Tutorial`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* Step-By-Step Tying Instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" /> Step-by-Step Tying Instructions:
                </h4>

                <div className="space-y-2.5">
                  {selectedKnot.steps.map((step, idx) => (
                    <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3 text-xs font-mono">
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-slate-200 leading-relaxed font-sans">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tip Callout */}
              <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl space-y-1 font-mono text-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Master Angler Tip:
                </span>
                <p className="text-emerald-200 italic leading-relaxed">
                  "{selectedKnot.proTip}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: LURES & BAIT MASTERCLASS */}
      {activeSection === 'LURES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {LURES_DATA.map((lure, idx) => (
              <div key={idx} className="bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                      {lure.category} • {lure.waterDepth}
                    </span>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">
                      {lure.name}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-950 text-emerald-300 font-mono text-[10px] font-bold rounded border border-slate-800">
                    Target: {lure.bestForSpecies.join(', ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <img src={lure.image} alt={lure.name} className="w-full h-28 object-cover rounded-lg border border-slate-800" />
                  <div className="sm:col-span-2 space-y-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Retrieval Technique:</span>
                      <p className="text-slate-200 leading-relaxed font-sans">{lure.technique}</p>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-amber-400 block">Beginner Pro Tip:</span>
                      <p className="text-slate-300 text-[11px] italic">{lure.beginnerTip}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Live Bait Overview */}
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl space-y-4 shadow-xl">
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Anchor className="w-5 h-5 text-blue-400" /> Live & Natural Bait Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-bold text-amber-400 uppercase text-sm block">🪱 Nightcrawlers & Worms</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Universal live bait for bass, trout, panfish, and catfish. Hook through head or thread on hook under a floating bobber.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-bold text-emerald-400 uppercase text-sm block">🐟 Live Minnows & Shiners</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Best live bait for trophy largemouth bass and crappie. Hook lightly through the lip or dorsal fin so it swims freely.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-bold text-cyan-400 uppercase text-sm block">🦐 Live Shrimp & Cut Bait</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Top choice for saltwater inshore species like Red Drum and Snook. Rig on circle hook with lead weight.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: LINE & RIGGING SETUP */}
      {activeSection === 'LINES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Monofilament */}
            <div className="bg-slate-900 border border-white/10 p-5 rounded-xl space-y-3 shadow-xl">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-[10px] font-black uppercase text-blue-400 block font-mono">Single Strand Nylon</span>
                <h3 className="text-lg font-black text-white uppercase">Monofilament Line</h3>
              </div>
              <ul className="text-xs font-mono text-slate-300 space-y-1.5">
                <li className="flex items-center gap-1.5 text-emerald-400">✓ Floats on surface (great for topwater)</li>
                <li className="flex items-center gap-1.5 text-emerald-400">✓ High stretch absorbs sudden shock</li>
                <li className="flex items-center gap-1.5 text-emerald-400">✓ Inexpensive & easy to tie</li>
                <li className="flex items-center gap-1.5 text-amber-400">⚠ Visible in clear water & degraded by sunlight</li>
              </ul>
              <div className="bg-slate-950 p-2.5 rounded text-[11px] font-mono text-slate-400 border border-slate-800">
                Recommended Test: 6lb - 12lb for general spinning reels.
              </div>
            </div>

            {/* Fluorocarbon */}
            <div className="bg-slate-900 border border-white/10 p-5 rounded-xl space-y-3 shadow-xl">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-[10px] font-black uppercase text-emerald-400 block font-mono">Fluoropolymer Material</span>
                <h3 className="text-lg font-black text-white uppercase">Fluorocarbon Line</h3>
              </div>
              <ul className="text-xs font-mono text-slate-300 space-y-1.5">
                <li className="flex items-center gap-1.5 text-emerald-400">✓ Nearly 100% invisible underwater</li>
                <li className="flex items-center gap-1.5 text-emerald-400">✓ Highly abrasion resistant to rocks/wood</li>
                <li className="flex items-center gap-1.5 text-emerald-400">✓ Sinks fast (great for jigs & soft plastics)</li>
                <li className="flex items-center gap-1.5 text-amber-400">⚠ Stiff line memory, requires moistening knots</li>
              </ul>
              <div className="bg-slate-950 p-2.5 rounded text-[11px] font-mono text-slate-400 border border-slate-800">
                Recommended Test: 8lb - 15lb as main line or leader line.
              </div>
            </div>

            {/* Braid */}
            <div className="bg-slate-900 border border-white/10 p-5 rounded-xl space-y-3 shadow-xl">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-[10px] font-black uppercase text-amber-400 block font-mono">Micro-Polyethylene Fibers</span>
                <h3 className="text-lg font-black text-white uppercase">Braided Line</h3>
              </div>
              <ul className="text-xs font-mono text-slate-300 space-y-1.5">
                <li className="flex items-center gap-1.5 text-emerald-400">✓ Zero stretch = extreme hook setting power</li>
                <li className="flex items-center gap-1.5 text-emerald-400">✓ Ultra thin diameter with massive strength</li>
                <li className="flex items-center gap-1.5 text-emerald-400">✓ Cuts through heavy lily pads & weeds</li>
                <li className="flex items-center gap-1.5 text-amber-400">⚠ Highly visible (use fluorocarbon leader!)</li>
              </ul>
              <div className="bg-slate-950 p-2.5 rounded text-[11px] font-mono text-slate-400 border border-slate-800">
                Recommended Test: 15lb - 30lb for spinning, 30lb - 50lb for baitcasting.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: RODS & REELS */}
      {activeSection === 'RODS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spinning Reel Combo */}
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 block font-mono">
                  #1 Recommended For Beginners
                </span>
                <h3 className="text-xl font-black text-white uppercase">Spinning Rod & Reel Combo</h3>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold rounded">
                Zero Backlash
              </span>
            </div>

            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              The reel hangs under the rod with an open bail wire. Easy to cast light lures, live bait, and spinners without birdnest line tangles.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <span className="font-bold text-white uppercase block">Ideal Beginner Setup:</span>
              <div className="text-slate-300 space-y-1">
                <div>• <strong>Rod:</strong> 6'6″ to 7'0″ Medium Power, Fast Action</div>
                <div>• <strong>Reel Size:</strong> 2500 or 3000 size spinning reel</div>
                <div>• <strong>Line:</strong> 15lb Braided line with 8lb Fluorocarbon leader</div>
              </div>
            </div>
          </div>

          {/* Baitcasting Reel Combo */}
          <div className="bg-slate-900 border border-white/10 p-6 rounded-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400 block font-mono">
                  Advanced Pinpoint Precision
                </span>
                <h3 className="text-xl font-black text-white uppercase">Baitcasting Rod & Reel Combo</h3>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold rounded">
                High Power & Accuracy
              </span>
            </div>

            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              Reel sits on top of rod with revolving spool controlled by thumb pressure. Handles heavy lures and delivers pinpoint casting accuracy into heavy cover.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <span className="font-bold text-white uppercase block">Ideal Power Setup:</span>
              <div className="text-slate-300 space-y-1">
                <div>• <strong>Rod:</strong> 7'0″ Medium-Heavy Power, Fast Action</div>
                <div>• <strong>Reel Ratio:</strong> 7.1:1 gear ratio baitcaster</div>
                <div>• <strong>Line:</strong> 14lb Fluorocarbon or 40lb Braided line</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: CASTING TECHNIQUES */}
      {activeSection === 'CASTING' && (
        <div className="bg-slate-900 border border-white/10 p-6 rounded-xl space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] font-black uppercase text-cyan-400 block font-mono">Casting Masterclass</span>
            <h3 className="text-xl font-black text-white uppercase">Standard Overhead Casting Technique</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center">1</span>
              <h4 className="font-bold text-white uppercase">Line Hang Distance</h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Reel the lure until it hangs 6 to 12 inches below the rod tip.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center">2</span>
              <h4 className="font-bold text-white uppercase">Open Bail / Hold Line</h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Hold line against rod handle with index finger, then open the reel bail wire.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center">3</span>
              <h4 className="font-bold text-white uppercase">Backswing to 1:00</h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Smoothly raise rod tip over your shoulder to 1:00 position, letting the rod load up.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="w-7 h-7 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center">4</span>
              <h4 className="font-bold text-white uppercase">Forward Release</h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Accelerate rod forward toward target and release index finger at 10:00 position.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
