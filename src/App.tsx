import React, { useState, useEffect } from 'react';
import { CatchLogItem, FishingSpot } from './types/catchLogTypes';
import { loadStoredCatches, saveStoredCatches, loadStoredSpots, saveStoredSpots } from './utils/storage';
import { FishDimensionEstimator } from './components/FishDimensionEstimator';
import { CatchLogbookView } from './components/CatchLogbookView';
import { SpotTrackerMap } from './components/SpotTrackerMap';
import { TackleAssistantView } from './components/TackleAssistantView';
import { BeginnerGuideView } from './components/BeginnerGuideView';
import { SolunarActivityView } from './components/SolunarActivityView';
import { BarometricTrackerView } from './components/BarometricTrackerView';
import { TackleBoxInventoryView } from './components/TackleBoxInventoryView';
import { TrophyWallView } from './components/TrophyWallView';
import { LivewellTimerView } from './components/LivewellTimerView';
import { FishReportView } from './components/FishReportView';
import { InsightsView } from './components/InsightsView';
import { AssistantView } from './components/AssistantView';
import { SettingsView } from './components/SettingsView';
import { OwnerSignInModal } from './components/OwnerSignInModal';
import { UpgradeBanner } from './components/UpgradeBanner';
import { isSignedIn, signOut } from './utils/apiAuth';

import {
  Camera,
  BookOpen,
  MapPin,
  Target,
  Sparkles,
  Fish,
  GraduationCap,
  Moon,
  TrendingDown,
  Package,
  Trophy,
  Timer,
  Gauge,
  Brain,
  Bot,
  Settings,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<
    | 'VISION' | 'LOGBOOK' | 'SPOTS' | 'TACKLE' | 'GUIDE' | 'SOLUNAR' | 'PRESSURE' | 'BOX' | 'TROPHY' | 'LIVEWELL'
    | 'REPORT' | 'INSIGHTS' | 'ASSISTANT' | 'SETTINGS'
  >('REPORT');

  const [catches, setCatches] = useState<CatchLogItem[]>([]);
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [signedIn, setSignedIn] = useState<boolean>(isSignedIn());
  const [showSignIn, setShowSignIn] = useState<boolean>(false);

  useEffect(() => {
    setCatches(loadStoredCatches());
    setSpots(loadStoredSpots());
  }, []);

  const handleSaveCatch = (newCatchData: Omit<CatchLogItem, 'id' | 'timestamp' | 'formattedDate'>) => {
    const now = new Date();
    const formattedDate =
      now.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).toUpperCase() +
      ' • ' +
      now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

    const newCatch: CatchLogItem = {
      ...newCatchData,
      id: `catch-${Date.now()}`,
      timestamp: now.toISOString(),
      formattedDate,
    };

    const updated = [newCatch, ...catches];
    setCatches(updated);
    saveStoredCatches(updated);

    const matchingSpot = spots.find((s) => s.name.toLowerCase() === newCatchData.locationName.toLowerCase());
    if (matchingSpot) {
      const updatedSpots = spots.map((s) => (s.id === matchingSpot.id ? { ...s, totalCatches: s.totalCatches + 1 } : s));
      setSpots(updatedSpots);
      saveStoredSpots(updatedSpots);
    }
  };

  const handleDeleteCatch = (id: string) => {
    const updated = catches.filter((c) => c.id !== id);
    setCatches(updated);
    saveStoredCatches(updated);
  };

  const handleAddSpot = (spotData: Omit<FishingSpot, 'id' | 'totalCatches'>) => {
    const newSpot: FishingSpot = {
      ...spotData,
      id: `spot-${Date.now()}`,
      totalCatches: 0,
    };
    const updated = [...spots, newSpot];
    setSpots(updated);
    saveStoredSpots(updated);
  };

  return (
    <div className="min-h-screen bg-[#06100f] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Main Navbar Header */}
      <header className="sticky top-0 z-40 bg-dusk backdrop-blur-md border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('VISION')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 via-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg glow-emerald">
              <Fish className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-display font-black tracking-tight text-white uppercase">
                  Fish<span className="text-emerald-400">AI</span>
                </h1>
              </div>
              <span className="text-[10px] font-mono text-slate-400 block -mt-0.5">
                Multi-Modal Vision & All-in-One Angler Platform
              </span>
            </div>
          </div>

          {/* Primary Nav Buttons */}
          <div className="flex items-center gap-2 min-w-0">
          <nav className="flex items-center gap-1 flex-wrap py-1 flex-1 min-w-0">
            {[
              { id: 'REPORT', label: 'Fish Report', icon: Gauge, color: 'bg-teal-500 text-slate-950' },
              { id: 'VISION', label: 'Vision', icon: Camera, color: 'bg-emerald-500 text-slate-950' },
              { id: 'LOGBOOK', label: 'Logbook', icon: BookOpen, color: 'bg-blue-600 text-white' },
              { id: 'INSIGHTS', label: 'Insights', icon: Brain, color: 'bg-violet-600 text-white' },
              { id: 'ASSISTANT', label: 'Assistant', icon: Bot, color: 'bg-fuchsia-600 text-white' },
              { id: 'SPOTS', label: 'Spot Map', icon: MapPin, color: 'bg-cyan-500 text-slate-950' },
              { id: 'TACKLE', label: 'Tackle AI', icon: Target, color: 'bg-amber-500 text-slate-950' },
              { id: 'SOLUNAR', label: 'Solunar', icon: Moon, color: 'bg-purple-600 text-white' },
              { id: 'PRESSURE', label: 'Pressure', icon: TrendingDown, color: 'bg-red-500 text-white' },
              { id: 'BOX', label: 'Tackle Box', icon: Package, color: 'bg-amber-400 text-slate-950' },
              { id: 'TROPHY', label: 'Trophies', icon: Trophy, color: 'bg-amber-300 text-slate-950' },
              { id: 'LIVEWELL', label: 'Livewell', icon: Timer, color: 'bg-teal-500 text-slate-950' },
              { id: 'GUIDE', label: 'Academy', icon: GraduationCap, color: 'bg-emerald-400 text-slate-950' },
              { id: 'SETTINGS', label: 'Settings', icon: Settings, color: 'bg-sky-500 text-slate-950' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    isActive ? `${tab.color} shadow-lg font-black` : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] sm:text-xs whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Owner sign-in / badge */}
          {signedIn ? (
            <button
              onClick={() => {
                if (window.confirm('Sign out of owner mode? AI analysis will be locked until you sign in again.')) {
                  signOut();
                  setSignedIn(false);
                }
              }}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 hover:bg-emerald-500/25 transition-all"
              title="Tap to sign out"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Owner
            </button>
          ) : (
            <button
              onClick={() => setShowSignIn(true)}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg"
            >
              Sign In
            </button>
          )}
          </div>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <UpgradeBanner />
        {activeTab === 'REPORT' && <FishReportView catches={catches} spots={spots} />}

        {activeTab === 'VISION' && (
          <FishDimensionEstimator
            onSaveCatchToLog={handleSaveCatch}
            onNavigateToLogbook={() => setActiveTab('LOGBOOK')}
          />
        )}

        {activeTab === 'LOGBOOK' && (
          <CatchLogbookView
            catches={catches}
            spots={spots}
            onAddCatch={handleSaveCatch}
            onDeleteCatch={handleDeleteCatch}
            onNavigateToFishVision={() => setActiveTab('VISION')}
          />
        )}

        {activeTab === 'INSIGHTS' && <InsightsView catches={catches} />}

        {activeTab === 'ASSISTANT' && <AssistantView catches={catches} spots={spots} />}

        {activeTab === 'SPOTS' && (
          <SpotTrackerMap
            spots={spots}
            catches={catches}
            onAddSpot={handleAddSpot}
            onSelectSpotFilter={() => setActiveTab('LOGBOOK')}
          />
        )}

        {activeTab === 'TACKLE' && <TackleAssistantView />}

        {activeTab === 'SETTINGS' && <SettingsView />}

        {activeTab === 'SOLUNAR' && <SolunarActivityView spots={spots} />}

        {activeTab === 'PRESSURE' && <BarometricTrackerView spots={spots} />}

        {activeTab === 'BOX' && <TackleBoxInventoryView />}

        {activeTab === 'TROPHY' && <TrophyWallView catches={catches} />}

        {activeTab === 'LIVEWELL' && <LivewellTimerView />}

        {activeTab === 'GUIDE' && <BeginnerGuideView />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-white/10 py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-400">FishAI</span>
          </div>
          <span>13 Integrated Fishing Modules • Real Weather, Solunar Math & Personal Learning Loop</span>
        </div>
      </footer>

      <OwnerSignInModal
        open={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSignedIn={() => setSignedIn(true)}
      />
    </div>
  );
}
export default App;
