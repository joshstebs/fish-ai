import React from 'react';
import { Trophy, Award, Sparkles, Crown, Lock } from 'lucide-react';
import { CatchLogItem } from '../types/catchLogTypes';
import { analyzeCatches, parseWeightLbs, parseLengthInches, speciesOf } from '../utils/insights';

interface TrophyWallProps {
  catches: CatchLogItem[];
}

interface Badge {
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  progress?: string;
}

export const TrophyWallView: React.FC<TrophyWallProps> = ({ catches }) => {
  const insights = analyzeCatches(catches);

  const speciesSet = new Set(catches.map((c) => speciesOf(c).toLowerCase()));
  const hasBass = speciesSet.has('largemouth bass') || speciesSet.has('smallmouth bass') || speciesSet.has('bass');
  const hasPike = speciesSet.has('northern pike') || speciesSet.has('pike');
  const bassOver5 = catches.some((c) => {
    const s = speciesOf(c).toLowerCase();
    return (s.includes('bass') || s.includes('largemouth')) && (parseWeightLbs(c.estimatedWeight) ?? 0) >= 5;
  });
  const pikeOver25 = catches.some((c) => {
    const s = speciesOf(c).toLowerCase();
    return (s.includes('pike') || s.includes('muskie')) && (parseLengthInches(c.estimatedLength) ?? 0) >= 25;
  });
  const withWeather = catches.filter((c) => c.weather).length;

  const badges: Badge[] = [
    {
      title: 'First Fish',
      desc: 'Log your first catch',
      icon: '🐟',
      unlocked: catches.length >= 1,
      progress: catches.length >= 1 ? undefined : '0/1 catches',
    },
    {
      title: 'Bass Angler',
      desc: 'Land your first bass',
      icon: '🎣',
      unlocked: hasBass,
      progress: hasBass ? undefined : 'No bass logged yet',
    },
    {
      title: 'Pike Hunter',
      desc: 'Land your first pike or muskie',
      icon: '🐊',
      unlocked: hasPike,
      progress: hasPike ? undefined : 'No pike logged yet',
    },
    {
      title: '5lb+ Bass Club',
      desc: 'Land a bass over 5 lbs',
      icon: '🏆',
      unlocked: bassOver5,
      progress: bassOver5 ? undefined : 'No 5lb+ bass yet',
    },
    {
      title: 'Pike Monster Hunter',
      desc: 'Land a pike/muskie over 25 inches',
      icon: '⚔️',
      unlocked: pikeOver25,
      progress: pikeOver25 ? undefined : 'No 25"+ pike yet',
    },
    {
      title: 'Weather Pioneer',
      desc: 'Log a catch with real weather conditions',
      icon: '⛈️',
      unlocked: withWeather >= 1,
      progress: withWeather >= 1 ? undefined : `${withWeather}/1 with weather`,
    },
    {
      title: 'Double Digits',
      desc: 'Log 10 catches',
      icon: '🔟',
      unlocked: catches.length >= 10,
      progress: `${catches.length}/10 catches`,
    },
    {
      title: 'Century Club',
      desc: 'Log 100 catches',
      icon: '💯',
      unlocked: catches.length >= 100,
      progress: `${catches.length}/100 catches`,
    },
    {
      title: 'Species Collector',
      desc: 'Catch 5 different species',
      icon: '🧬',
      unlocked: insights.speciesCount >= 5,
      progress: `${insights.speciesCount}/5 species`,
    },
    {
      title: 'Master Angler',
      desc: 'Catch 10 different species',
      icon: '👑',
      unlocked: insights.speciesCount >= 10,
      progress: `${insights.speciesCount}/10 species`,
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="tool-heading flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded">
              FishAI Hall of Fame
            </span>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Real Achievements Only
            </span>
          </div>
          <h2 className="text-2xl font-display font-black uppercase text-white tracking-tight flex items-center gap-2">
            🏆 Catch Leaderboard & Trophy Wall
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Badges unlock only from catches you actually logged. No fake trophies; every award is earned.
          </p>
        </div>
        <div className="bg-slate-950 px-4 py-3 rounded-xl border border-amber-500/30 text-center shrink-0">
          <span className="text-2xl font-black text-amber-400 font-mono block">{unlockedCount}/{badges.length}</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Badges Unlocked</span>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" /> Angler Badges
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {badges.map((b, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl space-y-2 shadow-xl flex flex-col items-start gap-2 border transition-all ${
                b.unlocked
                  ? 'bg-slate-900 border-amber-500/40'
                  : 'bg-slate-950/60 border-slate-800 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-3xl ${b.unlocked ? '' : 'grayscale opacity-50'}`}>{b.icon}</span>
                {b.unlocked ? (
                  <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-500/10 border border-amber-500/40 rounded px-1.5 py-0.5 font-mono">
                    UNLOCKED
                  </span>
                ) : (
                  <Lock className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase leading-tight">{b.title}</h4>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{b.desc}</span>
              </div>
              {!b.unlocked && b.progress && (
                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5">
                  {b.progress}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Personal Best Records Wall */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" /> Species Personal Best (PB) Records
        </h3>

        {insights.personalBests.length === 0 ? (
          <div className="bg-slate-900 border border-white/10 rounded-xl p-10 text-center space-y-3 shadow-xl">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-black uppercase tracking-wider text-white">No PB records yet</p>
            <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
              Log catches with estimated weights and your biggest fish per species will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.personalBests.map((pb) => (
              <div key={pb.commonName} className="bg-slate-900 border border-amber-500/20 p-5 rounded-xl space-y-3 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-black uppercase text-amber-400 font-mono">PB: {pb.commonName}</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{pb.catch.formattedDate.split('•')[0]}</span>
                </div>

                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                  {pb.catch.photoUrl ? (
                    <img src={pb.catch.photoUrl} alt={pb.commonName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-slate-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                    <h4 className="text-sm font-black text-white uppercase">{pb.commonName}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-[9px] uppercase text-slate-400 block font-bold">Weight</span>
                    <span className="text-xs font-black text-amber-400 truncate block">{pb.weightLbs} lbs</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-[9px] uppercase text-slate-400 block font-bold">Location</span>
                    <span className="text-xs font-black text-white truncate block">{pb.catch.locationName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-amber-400" />
        All badges and records are computed live from your logged catches (nothing is pre-unlocked).
      </p>
    </div>
  );
};

