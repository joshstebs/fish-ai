import React, { useState, useEffect, lazy, Suspense } from 'react';
import { CatchLogItem, FishingSpot } from './types/catchLogTypes';
import { loadStoredCatches, saveStoredCatches, loadStoredSpots, saveStoredSpots } from './utils/storage';
import { OwnerSignInModal } from './components/OwnerSignInModal';
import { isSignedIn, signOut } from './utils/apiAuth';

// Heavy views are lazy-loaded so the first screen (Fish Report) stays tiny on mobile.
const FishDimensionEstimator = lazy(() => import('./components/FishDimensionEstimator').then((m) => ({ default: m.FishDimensionEstimator })));
const CatchLogbookView = lazy(() => import('./components/CatchLogbookView').then((m) => ({ default: m.CatchLogbookView })));
const SpotTrackerMap = lazy(() => import('./components/SpotTrackerMap').then((m) => ({ default: m.SpotTrackerMap })));
const TackleAssistantView = lazy(() => import('./components/TackleAssistantView').then((m) => ({ default: m.TackleAssistantView })));
const BeginnerGuideView = lazy(() => import('./components/BeginnerGuideView').then((m) => ({ default: m.BeginnerGuideView })));
const SolunarActivityView = lazy(() => import('./components/SolunarActivityView').then((m) => ({ default: m.SolunarActivityView })));
const BarometricTrackerView = lazy(() => import('./components/BarometricTrackerView').then((m) => ({ default: m.BarometricTrackerView })));
const TackleBoxInventoryView = lazy(() => import('./components/TackleBoxInventoryView').then((m) => ({ default: m.TackleBoxInventoryView })));
const TrophyWallView = lazy(() => import('./components/TrophyWallView').then((m) => ({ default: m.TrophyWallView })));
const LivewellTimerView = lazy(() => import('./components/LivewellTimerView').then((m) => ({ default: m.LivewellTimerView })));
const FishReportView = lazy(() => import('./components/FishReportView').then((m) => ({ default: m.FishReportView })));
const InsightsView = lazy(() => import('./components/InsightsView').then((m) => ({ default: m.InsightsView })));
const AssistantView = lazy(() => import('./components/AssistantView').then((m) => ({ default: m.AssistantView })));
const SettingsView = lazy(() => import('./components/SettingsView').then((m) => ({ default: m.SettingsView })));

import {
  Camera,
  BookOpen,
  MapPin,
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
  ChevronDown,
  LayoutGrid,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';

type TabId =
  | 'VISION' | 'LOGBOOK' | 'SPOTS' | 'TACKLE' | 'GUIDE' | 'SOLUNAR' | 'PRESSURE' | 'BOX' | 'TROPHY'
  | 'LIVEWELL' | 'REPORT' | 'INSIGHTS' | 'ASSISTANT' | 'SETTINGS';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

/** Top-level tabs — the five things anglers use every trip. */
const PRIMARY_TABS: TabDef[] = [
  { id: 'REPORT', label: 'Fish Report', icon: Gauge, color: 'bg-teal-500 text-slate-950' },
  { id: 'VISION', label: 'Vision', icon: Camera, color: 'bg-emerald-500 text-slate-950' },
  { id: 'LOGBOOK', label: 'Logbook', icon: BookOpen, color: 'bg-blue-600 text-white' },
  { id: 'INSIGHTS', label: 'Insights', icon: Brain, color: 'bg-violet-600 text-white' },
  { id: 'ASSISTANT', label: 'Assistant', icon: Bot, color: 'bg-fuchsia-600 text-white' },
];

/** Everything else — tucked in the More menu so the main bar stays calm. */
const MORE_TABS: TabDef[] = [
  { id: 'SPOTS', label: 'Spot Map', icon: MapPin, color: 'bg-cyan-500 text-slate-950' },
  { id: 'TACKLE', label: 'Tackle AI', icon: Sparkles, color: 'bg-amber-500 text-slate-950' },
  { id: 'SOLUNAR', label: 'Solunar', icon: Moon, color: 'bg-purple-600 text-white' },
  { id: 'PRESSURE', label: 'Pressure', icon: TrendingDown, color: 'bg-red-500 text-white' },
  { id: 'BOX', label: 'Tackle Box', icon: Package, color: 'bg-amber-400 text-slate-950' },
  { id: 'TROPHY', label: 'Trophies', icon: Trophy, color: 'bg-amber-300 text-slate-950' },
  { id: 'LIVEWELL', label: 'Livewell', icon: Timer, color: 'bg-teal-500 text-slate-950' },
  { id: 'GUIDE', label: 'Academy', icon: GraduationCap, color: 'bg-emerald-400 text-slate-950' },
  { id: 'SETTINGS', label: 'Settings', icon: Settings, color: 'bg-sky-500 text-slate-950' },
];

const MORE_IDS = new Set(MORE_TABS.map((t) => t.id));

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('REPORT');
  const [moreOpen, setMoreOpen] = useState<boolean>(false);

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

  const goTo = (tab: TabId) => {
    setActiveTab(tab);
    setMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPricing = () => {
    setActiveTab('SETTINGS');
    setMoreOpen(false);
    // Let Settings render, then bring the pricing card into view.
    setTimeout(() => {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const moreActive = MORE_IDS.has(activeTab);

  const renderTabButton = (tab: TabDef) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => goTo(tab.id)}
        className={`px-3 py-1.5 sm:px-3 sm:py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
          isActive ? `${tab.color} shadow-lg font-black scale-105` : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
        }`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[10px] sm:text-xs whitespace-nowrap">{tab.label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#06100f] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Main Navbar Header */}
      <header className="sticky top-0 z-40 bg-dusk backdrop-blur-md border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => goTo('VISION')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 via-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg glow-emerald">
              <Fish className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-display font-black tracking-tight text-white uppercase leading-none">
                  Fish<span className="text-emerald-400">AI</span>
                </h1>
              </div>
              <span className="text-[10px] font-mono text-slate-400 block -mt-0.5 hidden sm:block">
                Fish smarter. Log every catch.
              </span>
            </div>
          </div>

          {/* Desktop primary nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0 justify-end">
            {PRIMARY_TABS.map(renderTabButton)}
            <div className="relative">
              <button
                onClick={() => setMoreOpen((v) => !v)}
                className={`px-3 py-1.5 sm:px-3 sm:py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                  moreActive || moreOpen
                    ? 'bg-slate-700 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] sm:text-xs whitespace-nowrap">More</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop dropdown */}
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-20 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 grid grid-cols-3 gap-1">
                    {MORE_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => goTo(tab.id)}
                          className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                            isActive ? `${tab.color} shadow-lg` : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Owner sign-in / badge (desktop) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {!signedIn && (
              <button
                onClick={goToPricing}
                className="px-3 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 hover:from-emerald-300 hover:to-teal-300 transition-all shadow-lg"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Try PRO Free
              </button>
            )}
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

          {/* Mobile: compact sign-in / PRO */}
          <div className="md:hidden flex items-center gap-2 shrink-0">
            {signedIn ? (
              <button
                onClick={() => {
                  if (window.confirm('Sign out of owner mode?')) {
                    signOut();
                    setSignedIn(false);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Owner
              </button>
            ) : (
              <button
                onClick={goToPricing}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-lg flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Try PRO
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-8">
        <Suspense
          fallback={
            <div className="py-24 text-center text-xs font-mono text-slate-500 uppercase tracking-widest">Loading…</div>
          }
        >
        {/* First-run coach — only while the logbook is empty */}
        {activeTab === 'REPORT' && catches.length === 0 && (
          <div className="mb-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-display font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  New here? Start with your first catch.
                </h2>
                <p className="text-sm text-slate-300 mt-1 max-w-xl">
                  Snap a photo in <span className="text-emerald-400 font-bold">Vision</span> to measure any fish in
                  seconds — or log one manually. Your logbook powers smarter reports over time.
                </p>
                <p className="text-xs text-slate-400 mt-1.5">
                  AI catch sizing is PRO — first 7 days free, $7.99/mo after, cancel anytime.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  onClick={() => goTo('VISION')}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2 hover:from-emerald-400 hover:to-teal-400 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  Measure a Fish
                </button>
                <button
                  onClick={() => goTo('LOGBOOK')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider rounded-lg border border-slate-700 flex items-center gap-2 transition-all"
                >
                  <PlusCircle className="w-4 h-4 text-cyan-400" />
                  Quick Log
                </button>
                <button
                  onClick={goToPricing}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-wider rounded-lg border border-white/20 flex items-center gap-2 transition-all"
                >
                  Try PRO
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'REPORT' && <FishReportView catches={catches} spots={spots} />}

        {activeTab === 'VISION' && (
          <FishDimensionEstimator
            onSaveCatchToLog={handleSaveCatch}
            onNavigateToLogbook={() => goTo('LOGBOOK')}
          />
        )}

        {activeTab === 'LOGBOOK' && (
          <CatchLogbookView
            catches={catches}
            spots={spots}
            onAddCatch={handleSaveCatch}
            onDeleteCatch={handleDeleteCatch}
            onNavigateToFishVision={() => goTo('VISION')}
          />
        )}

        {activeTab === 'INSIGHTS' && <InsightsView catches={catches} />}

        {activeTab === 'ASSISTANT' && <AssistantView catches={catches} spots={spots} />}

        {activeTab === 'SPOTS' && (
          <SpotTrackerMap
            spots={spots}
            catches={catches}
            onAddSpot={handleAddSpot}
            onSelectSpotFilter={() => goTo('LOGBOOK')}
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
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-white/10 py-6 text-center text-xs font-mono text-slate-500 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-400">FishAI</span>
          </div>
          <span>Free core app. AI estimator: 7-day free trial, $7.99/mo after, cancel anytime.</span>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {PRIMARY_TABS.slice(0, 4).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-black uppercase tracking-wider transition-all ${
                  isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                {tab.label}
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-black uppercase tracking-wider transition-all ${
              moreActive || moreOpen ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            More
          </button>
        </div>

        {/* Mobile More sheet */}
        {moreOpen && (
          <div className="absolute bottom-full inset-x-0 bg-slate-900 border-t border-white/10 rounded-t-2xl shadow-2xl p-3 pb-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">All Tools</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-white px-2 py-1"
              >
                Close ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {MORE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => goTo(tab.id)}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                      isActive ? `${tab.color} shadow-lg` : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            {!signedIn && (
              <button
                onClick={() => {
                  setMoreOpen(false);
                  setShowSignIn(true);
                }}
                className="mt-2 w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black text-[10px] uppercase tracking-wider hover:bg-emerald-500/25 transition-all"
              >
                Owner Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      <OwnerSignInModal
        open={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSignedIn={() => setSignedIn(true)}
      />
    </div>
  );
}
export default App;
