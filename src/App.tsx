import React, { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CatchLogItem, FishingSpot } from './types/catchLogTypes';
import { loadStoredCatches, loadStoredSpots, saveStoredCatches, saveStoredSpots } from './utils/storage';
import { OwnerSignInModal } from './components/OwnerSignInModal';
import { SetupFlow } from './components/SetupFlow';
import { DailyReport } from './components/DailyReport';
import { fetchOwnerStatus, signOut } from './utils/apiAuth';
import { AnglerProfile, hasHomeWater, loadProfile, saveProfile } from './utils/profile';
import {
  BookOpen,
  Bot,
  Brain,
  Camera,
  ChevronDown,
  Fish,
  Gauge,
  GraduationCap,
  LayoutGrid,
  MapPin,
  Moon,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Timer,
  TrendingDown,
  Trophy,
} from 'lucide-react';
import { GlobalSeo } from './components/SeoHead';
import { ListiclePage } from './pages/ListiclePage';
import { HowToChoosePage } from './pages/HowToChoosePage';
import { CompareFishbrainPage } from './pages/CompareFishbrainPage';
import { CompareFishAnglerPage } from './pages/CompareFishAnglerPage';

const FishDimensionEstimator = React.lazy(() => import('./components/FishDimensionEstimator').then((m) => ({ default: m.FishDimensionEstimator })));
const CatchLogbookView = React.lazy(() => import('./components/CatchLogbookView').then((m) => ({ default: m.CatchLogbookView })));
const SpotTrackerMap = React.lazy(() => import('./components/SpotTrackerMap').then((m) => ({ default: m.SpotTrackerMap })));
const TackleAssistantView = React.lazy(() => import('./components/TackleAssistantView').then((m) => ({ default: m.TackleAssistantView })));
const BeginnerGuideView = React.lazy(() => import('./components/BeginnerGuideView').then((m) => ({ default: m.BeginnerGuideView })));
const SolunarActivityView = React.lazy(() => import('./components/SolunarActivityView').then((m) => ({ default: m.SolunarActivityView })));
const BarometricTrackerView = React.lazy(() => import('./components/BarometricTrackerView').then((m) => ({ default: m.BarometricTrackerView })));
const TackleBoxInventoryView = React.lazy(() => import('./components/TackleBoxInventoryView').then((m) => ({ default: m.TackleBoxInventoryView })));
const TrophyWallView = React.lazy(() => import('./components/TrophyWallView').then((m) => ({ default: m.TrophyWallView })));
const LivewellTimerView = React.lazy(() => import('./components/LivewellTimerView').then((m) => ({ default: m.LivewellTimerView })));
const InsightsView = React.lazy(() => import('./components/InsightsView').then((m) => ({ default: m.InsightsView })));
const AssistantView = React.lazy(() => import('./components/AssistantView').then((m) => ({ default: m.AssistantView })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then((m) => ({ default: m.SettingsView })));
const ShopView = React.lazy(() => import('./components/ShopView').then((m) => ({ default: m.ShopView })));

type TabId = 'REPORT' | 'VISION' | 'LOGBOOK' | 'SPOTS' | 'TACKLE' | 'GUIDE' | 'SOLUNAR' | 'PRESSURE' | 'BOX' | 'TROPHY' | 'LIVEWELL' | 'INSIGHTS' | 'ASSISTANT' | 'SETTINGS' | 'SHOP';
interface TabDef {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const PRIMARY_TABS: TabDef[] = [
  { id: 'REPORT', label: 'Fish Report', icon: Gauge, color: 'bg-teal-500 text-slate-950' },
  { id: 'VISION', label: 'Vision', icon: Camera, color: 'bg-emerald-500 text-slate-950' },
  { id: 'LOGBOOK', label: 'Logbook', icon: BookOpen, color: 'bg-blue-600 text-white' },
  { id: 'INSIGHTS', label: 'Insights', icon: Brain, color: 'bg-violet-600 text-white' },
  { id: 'ASSISTANT', label: 'Assistant', icon: Bot, color: 'bg-fuchsia-600 text-white' },
  { id: 'SHOP', label: 'Shop', icon: ShoppingBag, color: 'bg-amber-500 text-slate-950' },
];

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

const MORE_IDS = new Set(MORE_TABS.map((tab) => tab.id));

function useAppState() {
  const [activeTab, setActiveTab] = React.useState<TabId>('REPORT');
  const [catches, setCatches] = React.useState<CatchLogItem[]>([]);
  const [spots, setSpots] = React.useState<FishingSpot[]>([]);
  const [signedIn, setSignedIn] = React.useState(false);
  const [showSignIn, setShowSignIn] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [proFromHeader, setProFromHeader] = React.useState(false);
  const [profile, setProfile] = React.useState<AnglerProfile>(() => loadProfile());
  const [setupOpen, setSetupOpen] = React.useState(false);

  React.useEffect(() => {
    setCatches(loadStoredCatches());
    setSpots(loadStoredSpots());
    void fetchOwnerStatus().then(setSignedIn);
  }, []);

  return {
    activeTab,
    setActiveTab,
    catches,
    setCatches,
    spots,
    setSpots,
    signedIn,
    setSignedIn,
    showSignIn,
    setShowSignIn,
    moreOpen,
    setMoreOpen,
    proFromHeader,
    setProFromHeader,
    profile,
    setProfile,
    setupOpen,
    setSetupOpen,
  };
}

function SeoLanding({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl sm:text-5xl font-display font-black uppercase tracking-tight text-white leading-none">
        fish<span className="text-emerald-400">AI</span>
      </h1>
      <p className="mt-3 text-slate-300 text-sm sm:text-base">
        Fishing tools centered on your own catches, locations, and conditions.
      </p>
      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        {[
          ['AI Fish ID', 'Upload your photo for a species hypothesis, confidence score, and caveated visual estimates.'],
          ['Logbook + Insights', 'Store your catches locally and derive patterns only from the catches you actually record.'],
          ['Weather + Solunar', 'Use live Open-Meteo weather and locally computed astronomy for the water you select.'],
        ].map(([title, detail]) => (
          <div key={title} className="bg-slate-900 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-400">{title}</div>
            <div className="mt-1 text-sm text-slate-300">{detail}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={onStart} className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Open the app
        </button>
        <a href="/blog" className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-wider border border-white/20">
          Read the journal
        </a>
      </div>
    </div>
  );
}

function BlogIndex({ onStart }: { onStart: () => void }) {
  const posts = [
    { slug: 'ai-fish-id-accuracy-2026', title: 'AI fish identification: practical limits and better inputs' },
    { slug: 'best-ai-fishing-app-2026', title: 'How to compare fishing apps without marketing claims' },
    { slug: 'solunar-clock-vs-app', title: 'Solunar timing: what FishAI calculates locally' },
    { slug: 'logbook-seo', title: 'What “local-first logbook” means in FishAI' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">Journal</h1>
      <p className="mt-2 text-slate-400 text-sm">Product notes and fishing-tool explainers. No fabricated field-testing claims.</p>
      <div className="mt-6 grid gap-3">
        {posts.map((post) => (
          <a key={post.slug} href={`/blog/${post.slug}`} className="block bg-slate-900 border border-white/10 rounded-2xl p-4 hover:border-emerald-500/40 transition-colors">
            <div className="text-sm font-black text-white">{post.title}</div>
            <div className="mt-1 text-xs text-slate-400">Open</div>
          </a>
        ))}
      </div>
      <button onClick={onStart} className="mt-6 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-wider border border-white/20">
        Back to app
      </button>
    </div>
  );
}

function BlogPost({ slug, onStart }: { slug: string; onStart: () => void }) {
  const posts: Record<string, { title: string; body: string[] }> = {
    'ai-fish-id-accuracy-2026': {
      title: 'AI fish identification: practical limits and better inputs',
      body: [
        'FishAI sends the photo you choose to a configured vision provider. The returned confidence score is model output, not proof of species identity.',
        'Clear side profiles, good lighting, and visible diagnostic features generally give the model more useful information than distant or obstructed photos.',
        'Visual length and weight estimates are inherently uncertain. FishAI now returns no measurement when the provider cannot support a useful estimate, and it never treats AI output as a legal harvest decision.',
      ],
    },
    'best-ai-fishing-app-2026': {
      title: 'How to compare fishing apps without marketing claims',
      body: [
        'Choose based on the workflow you actually need: social discovery, mapping, regulations, logging, weather, or personal analysis.',
        'FishAI focuses on a local-first personal logbook, live weather, computed solunar timing, saved spots, and optional AI image analysis.',
        'Features and pricing in competing products can change. Verify current details with each provider rather than treating a comparison page as a permanent source of truth.',
      ],
    },
    'solunar-clock-vs-app': {
      title: 'Solunar timing: what FishAI calculates locally',
      body: [
        'FishAI computes its astronomy-derived timing from the selected coordinates and date instead of loading a prewritten table.',
        'Solunar timing is only one signal. Weather, pressure, water conditions, season, and your own catch history can matter more on a given trip.',
      ],
    },
    'logbook-seo': {
      title: 'What “local-first logbook” means in FishAI',
      body: [
        'Catches, saved spots, tackle, and profile data are stored in browser storage by default rather than uploaded to a FishAI database.',
        'When you request network features, relevant data can leave the device: coordinates are sent to weather or geocoding providers and uploaded fish photos are sent to the configured AI vision provider.',
      ],
    },
  };

  const post = posts[slug] || {
    title: 'Article not found',
    body: ['This article does not exist.'],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">{post.title}</h1>
      <div className="mt-6 space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
        {post.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <div className="mt-8 flex gap-3">
        <a href="/blog" className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-wider border border-white/20">
          All posts
        </a>
        <button onClick={onStart} className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg">
          Open FishAI
        </button>
      </div>
    </div>
  );
}

function ProductOverview({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">What FishAI actually does</h1>
      <p className="mt-3 text-slate-300 text-sm sm:text-base">
        A factual feature overview of the current web app.
      </p>
      <div className="mt-6 grid gap-3">
        {[
          ['Weather + pressure', 'Open-Meteo powers live conditions when you request them.'],
          ['Solunar', 'Astronomy-derived windows are calculated for the selected coordinates and date.'],
          ['Personal logbook', 'Your catches are stored locally by default and power local insights.'],
          ['AI vision', 'Your uploaded photo can be sent to a configured vision provider for a species hypothesis and caveated estimates.'],
          ['Spots + tackle + academy', 'Saved locations, gear inventory, rule-based tackle tools, timers, and beginner material live in the same app.'],
        ].map(([title, detail]) => (
          <div key={title} className="bg-slate-900 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-400">{title}</div>
            <div className="mt-1 text-sm text-slate-300">{detail}</div>
          </div>
        ))}
      </div>
      <button onClick={onStart} className="mt-6 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg">
        Open FishAI
      </button>
    </div>
  );
}

function AcademyIndex({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">Academy</h1>
      <p className="mt-2 text-slate-400 text-sm">Beginner-friendly reference material built into FishAI.</p>
      <div className="mt-6 grid gap-3">
        {[
          ['AI photo basics', 'Lighting, angle, diagnostic features, and why visual measurements are estimates.'],
          ['Solunar basics', 'Major periods, minor periods, and how to avoid treating them as guarantees.'],
          ['Reading pressure', 'How the pressure view presents rising, falling, and stable conditions.'],
          ['Logbook habits', 'Record consistent fields so later personal insights have useful sample sizes.'],
        ].map(([title, detail]) => (
          <div key={title} className="bg-slate-900 border border-white/10 rounded-2xl p-4">
            <div className="text-sm font-black text-white">{title}</div>
            <div className="mt-1 text-xs text-slate-400">{detail}</div>
          </div>
        ))}
      </div>
      <button onClick={onStart} className="mt-6 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-wider border border-white/20">
        Back to app
      </button>
    </div>
  );
}

export function AppRoutes() {
  const state = useAppState();
  const {
    activeTab,
    setActiveTab,
    catches,
    setCatches,
    spots,
    setSpots,
    signedIn,
    setSignedIn,
    showSignIn,
    setShowSignIn,
    moreOpen,
    setMoreOpen,
    proFromHeader,
    setProFromHeader,
    profile,
    setProfile,
    setupOpen,
    setSetupOpen,
  } = state;

  const handleSaveCatch = (newCatchData: Omit<CatchLogItem, 'id' | 'timestamp' | 'formattedDate'>) => {
    const now = new Date();
    const formattedDate =
      now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() +
      ' • ' +
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const newCatch: CatchLogItem = {
      ...newCatchData,
      id: `catch-${Date.now()}`,
      timestamp: now.toISOString(),
      formattedDate,
    };
    const updated = [newCatch, ...catches];
    setCatches(updated);
    saveStoredCatches(updated);

    const cleanLocation = newCatchData.locationName.trim().toLowerCase();
    if (cleanLocation) {
      const matchingSpot = spots.find((spot) => spot.name.trim().toLowerCase() === cleanLocation);
      if (matchingSpot) {
        const updatedSpots = spots.map((spot) =>
          spot.id === matchingSpot.id ? { ...spot, totalCatches: spot.totalCatches + 1 } : spot,
        );
        setSpots(updatedSpots);
        saveStoredSpots(updatedSpots);
      }
    }
  };

  const handleDeleteCatch = (id: string) => {
    const updated = catches.filter((item) => item.id !== id);
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

  const renderTabButton = (tab: TabDef) => {
    const Icon = tab.icon;
    const active = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => goTo(tab.id)}
        className={`px-3 py-1.5 sm:py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
          active ? `${tab.color} shadow-lg scale-105` : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
        }`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[10px] sm:text-xs whitespace-nowrap">{tab.label}</span>
      </button>
    );
  };

  const moreActive = MORE_IDS.has(activeTab);

  return (
    <>
      <GlobalSeo />
      <header className="sticky top-0 z-40 bg-dusk backdrop-blur-md border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => goTo('REPORT')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-400 via-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg glow-emerald">
              <Fish className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg font-display font-black tracking-tight text-white uppercase leading-none">
                Fish<span className="text-emerald-400">AI</span>
              </h1>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:block">Personal fishing intelligence</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0 justify-end">
            {PRIMARY_TABS.map(renderTabButton)}
            <div className="relative">
              <button
                onClick={() => setMoreOpen((value) => !value)}
                className={`px-3 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  moreActive || moreOpen ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> More
                <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-20 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 grid grid-cols-3 gap-1">
                    {MORE_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const active = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => goTo(tab.id)}
                          className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                            active ? `${tab.color} shadow-lg` : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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

          <div className="hidden md:flex items-center gap-2 shrink-0">
            {!signedIn && (
              <button
                onClick={() => { goTo('VISION'); setProFromHeader(true); }}
                className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
              >
                <Sparkles className="w-3.5 h-3.5" /> Try Pro
              </button>
            )}
            {signedIn ? (
              <button
                onClick={() => {
                  if (window.confirm('Sign out of owner mode?')) {
                    void signOut();
                    setSignedIn(false);
                  }
                }}
                className="px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black text-xs uppercase tracking-wider"
              >
                Owner
              </button>
            ) : (
              <button
                onClick={() => setShowSignIn(true)}
                className="px-3 py-2 rounded-lg bg-slate-800 text-white font-black text-xs uppercase tracking-wider"
              >
                Owner Sign In
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {signedIn ? (
              <button
                onClick={() => { void signOut(); setSignedIn(false); }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black text-[10px] uppercase"
              >
                Owner
              </button>
            ) : (
              <button
                onClick={() => { goTo('VISION'); setProFromHeader(true); }}
                className="px-3 py-1.5 rounded-lg bg-emerald-400 text-slate-950 font-black text-[10px] uppercase"
              >
                Try Pro
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-8">
        <Suspense fallback={<div className="py-24 text-center text-xs font-mono text-slate-500 uppercase tracking-widest">Loading…</div>}>
          {activeTab === 'REPORT' && (
            hasHomeWater(profile) && !setupOpen ? (
              <DailyReport profile={profile} onEdit={() => setSetupOpen(true)} />
            ) : (
              <div>
                {!hasHomeWater(profile) && (
                  <div className="mb-8 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">First run · 30 seconds</p>
                    <h2 className="headline mx-auto mt-3 max-w-xl text-center text-3xl sm:text-5xl">Set your water, get your report.</h2>
                  </div>
                )}
                <SetupFlow
                  initial={{ location: profile.location, species: profile.species, tackle: profile.tackle }}
                  onCancel={hasHomeWater(profile) ? () => setSetupOpen(false) : undefined}
                  onComplete={(next) => {
                    const fresh = { ...profile, ...next };
                    saveProfile(fresh);
                    setProfile(fresh);
                    setSetupOpen(false);
                  }}
                />
              </div>
            )
          )}
          {activeTab === 'VISION' && <FishDimensionEstimator onSaveCatchToLog={handleSaveCatch} onNavigateToLogbook={() => goTo('LOGBOOK')} openPro={proFromHeader} onProOpened={() => setProFromHeader(false)} />}
          {activeTab === 'LOGBOOK' && <CatchLogbookView catches={catches} spots={spots} onAddCatch={handleSaveCatch} onDeleteCatch={handleDeleteCatch} onNavigateToFishVision={() => goTo('VISION')} />}
          {activeTab === 'INSIGHTS' && <InsightsView catches={catches} />}
          {activeTab === 'ASSISTANT' && <AssistantView catches={catches} spots={spots} />}
          {activeTab === 'SPOTS' && <SpotTrackerMap spots={spots} catches={catches} onAddSpot={handleAddSpot} onSelectSpotFilter={() => goTo('LOGBOOK')} />}
          {activeTab === 'TACKLE' && <TackleAssistantView />}
          {activeTab === 'SETTINGS' && <SettingsView />}
          {activeTab === 'SOLUNAR' && <SolunarActivityView spots={spots} />}
          {activeTab === 'PRESSURE' && <BarometricTrackerView spots={spots} />}
          {activeTab === 'BOX' && <TackleBoxInventoryView />}
          {activeTab === 'TROPHY' && <TrophyWallView catches={catches} />}
          {activeTab === 'LIVEWELL' && <LivewellTimerView />}
          {activeTab === 'GUIDE' && <BeginnerGuideView />}
          {activeTab === 'SHOP' && <ShopView />}
        </Suspense>
      </main>

      <footer className="bg-slate-900 border-t border-white/10 py-6 text-xs font-mono text-slate-500 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-400">FishAI</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <span>Core tools are free. AI analysis: 7-day trial, then $7.99 USD/month.</span>
            <a className="hover:text-white underline" href="/privacy.html">Privacy</a>
            <a className="hover:text-white underline" href="/terms.html">Terms</a>
          </div>
        </div>
      </footer>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {PRIMARY_TABS.slice(0, 4).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => goTo(tab.id)} className={`flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-black uppercase tracking-wider ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
                <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''}`} />
                {tab.label}
              </button>
            );
          })}
          <button onClick={() => setMoreOpen((value) => !value)} className={`flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-black uppercase tracking-wider ${moreActive || moreOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
            <LayoutGrid className="w-5 h-5" /> More
          </button>
        </div>

        {moreOpen && (
          <div className="absolute bottom-full inset-x-0 bg-slate-900 border-t border-white/10 rounded-t-2xl shadow-2xl p-3 pb-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">All tools</span>
              <button onClick={() => setMoreOpen(false)} className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 py-1">Close ✕</button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[...PRIMARY_TABS.slice(4), ...MORE_TABS].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => goTo(tab.id)} className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider ${active ? `${tab.color} shadow-lg` : 'text-slate-400 hover:text-white hover:bg-slate-800/70'}`}>
                    <Icon className="w-5 h-5" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            {!signedIn && (
              <button onClick={() => { setMoreOpen(false); setShowSignIn(true); }} className="mt-2 w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black text-[10px] uppercase tracking-wider">
                Owner Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      <OwnerSignInModal open={showSignIn} onClose={() => setShowSignIn(false)} onSignedIn={() => setSignedIn(true)} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppRoutes />} />
        <Route path="/blog" element={<BlogIndex onStart={() => window.location.assign('/')} />} />
        <Route path="/blog/:slug" element={<BlogPost slug={window.location.pathname.replace('/blog/', '')} onStart={() => window.location.assign('/')} />} />
        <Route path="/best-fishing-app" element={<ProductOverview onStart={() => window.location.assign('/')} />} />
        <Route path="/listicle" element={<ListiclePage onStart={() => window.location.assign('/')} />} />
        <Route path="/how-to-choose" element={<HowToChoosePage onStart={() => window.location.assign('/')} />} />
        <Route path="/fishai-vs-fishbrain" element={<CompareFishbrainPage onStart={() => window.location.assign('/')} />} />
        <Route path="/fishai-vs-fishangler" element={<CompareFishAnglerPage onStart={() => window.location.assign('/')} />} />
        <Route path="/academy" element={<AcademyIndex onStart={() => window.location.assign('/')} />} />
        <Route path="/seo" element={<SeoLanding onStart={() => window.location.assign('/')} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
