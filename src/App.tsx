import React, { useState, useEffect, useRef } from 'react';
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
  MoreHorizontal,
} from 'lucide-react';

type TabId =
  | 'VISION' | 'LOGBOOK' | 'SPOTS' | 'TACKLE' | 'GUIDE' | 'SOLUNAR' | 'PRESSURE' | 'BOX' | 'TROPHY' | 'LIVEWELL'
  | 'REPORT' | 'INSIGHTS' | 'ASSISTANT' | 'SETTINGS';

interface NavTab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  color: string;
  primary: boolean;
}

/** Primary tabs stay in the header; the rest live under "More" to keep the
 *  nav compact on every screen size (previously 14 tabs in a scroll strip). */
const NAV_TABS: NavTab[] = [
  { id: 'REPORT', label: 'Fish Report', icon: Gauge, color: 'bg-teal-500 text-slate-950', primary: true },
  { id: 'VISION', label: 'Vision', icon: Camera, color: 'bg-emerald-500 text-slate-950', primary: true },
  { id: 'LOGBOOK', label: 'Logbook', icon: BookOpen, color: 'bg-blue-600 text-white', primary: true },
  { id: 'SPOTS', label: 'Spot Map', icon: MapPin, color: 'bg-cyan-500 text-slate-950', primary: true },
  { id: 'ASSISTANT', label: 'Assistant', icon: Bot, color: 'bg-fuchsia-600 text-white', primary: true },
  { id: 'INSIGHTS', label: 'Insights', icon: Brain, color: 'bg-violet-600 text-white', primary: false },
  { id: 'TACKLE', label: 'Tackle AI', icon: Target, color: 'bg-amber-500 text-slate-950', primary: false },
  { id: 'SOLUNAR', label: 'Solunar', icon: Moon, color: 'bg-purple-600 text-white', primary: false },
  { id: 'PRESSURE', label: 'Pressure', icon: TrendingDown, color: 'bg-red-500 text-white', primary: false },
  { id: 'BOX', label: 'Tackle Box', icon: Package, color: 'bg-amber-400 text-slate-950', primary: false },
  { id: 'TROPHY', label: 'Trophies', icon: Trophy, color: 'bg-amber-300 text-slate-950', primary: false },
  { id: 'LIVEWELL', label: 'Livewell', icon: Timer, color: 'bg-teal-500 text-slate-950', primary: false },
  { id: 'GUIDE', label: 'Academy', icon: GraduationCap, color: 'bg-emerald-400 text-slate-950', primary: false },
  { id: 'SETTINGS', label: 'Settings', icon: Settings, color: 'bg-sky-500 text-slate-950', primary: false },
];

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('REPORT');
  const [catches, setCatches] = useState<CatchLogItem[]>([]);
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [signedIn, setSignedIn] = useState<boolean>(isSignedIn());
  const [showSignIn, setShowSignIn] = useState<boolean>(false);
  const [moreOpen, setMoreOpen] = useState<boolean>(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close the "More" menu on outside click or Escape.
  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

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

  const selectTab = (tab: TabId) => {
    setActiveTab(tab);
    setMoreOpen(false);
  };

  const primaryTabs = NAV_TABS.filter((t) => t.primary);
  const moreTabs = NAV_TABS.filter((t) => !t.primary);
  const activeTabInMore = moreTabs.some((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-[#06100f] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Main Navbar Header */}
      <header className="sticky top-0 z-40 bg-dusk backdrop-blur-md border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => selectTab('VISION')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 via-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg glow-emerald">
              <Fish className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-display font-black tracking-tight text-white uppercase">
                  Fish<span className="text-emerald-400">AI</span>
                </h1>
              </div>
              <span className="text-[10px] font-mono text-slate-400 block -mt-0.5">
                Vision & All-in-One Angler Platform
              </span>
            </div>
          </div>

          {/* Primary Nav Buttons + More menu */}
          <div className="flex items-center gap-1.5 min-w-0">
            <nav className="flex items-center gap-1 overflow-x-auto py-1 flex-1 min-w-0" aria-label="Main navigation">
              {primaryTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => selectTab(tab.id)}
                    className={`px-3 py-1.5 sm:px-3 sm:py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                      isActive ? `${tab.color} shadow-lg font-black scale-105` : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[10px] sm:text-xs whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="relative shrink-0" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((o) => !o)}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                className={`px-3 py-1.5 sm:px-3 sm:py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeTabInMore
                    ? 'bg-slate-700 text-white shadow-lg'
                    : moreOpen
                      ? 'bg-slate-800/80 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <MoreHorizontal className="w-4 h-4 shrink-0" />
                <span className="text-[10px] sm:text-xs whitespace-nowrap">More</span>
              </button>
              {moreOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1.5 z-50"
                >
                  {moreTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="menuitem"
                        onClick={() => selectTab(tab.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-black uppercase tracking-wider transition-all ${
                          isActive ? `${tab.color} shadow-lg` : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="whitespace-nowrap">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

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
                title="Sign in to unlock AI analysis"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Unlock AI
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
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
          <span>Real weather • Solunar math • Your catch history</span>
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
