import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CatchLogItem, FishingSpot } from './types/catchLogTypes';
import { loadStoredCatches, saveStoredCatches, loadStoredSpots, saveStoredSpots } from './utils/storage';
import { OwnerSignInModal } from './components/OwnerSignInModal';
import { SetupFlow } from './components/SetupFlow';
import { DailyReport } from './components/DailyReport';
import { isSignedIn, signOut } from './utils/apiAuth';
import { loadProfile, saveProfile, hasHomeWater, AnglerProfile } from './utils/profile';
import {
  Camera, BookOpen, MapPin, Sparkles, Fish, GraduationCap, Moon,
  TrendingDown, Package, Trophy, Timer, Gauge, Brain, Bot, Settings,
  ChevronDown, LayoutGrid,
} from 'lucide-react';
import { GlobalSeo } from './components/SeoHead';
import { LandingHero } from './components/LandingHero';
import { LearningLoop } from './components/LearningLoop';
import { ListiclePage } from './pages/ListiclePage';
import { HowToChoosePage } from './pages/HowToChoosePage';
import { CompareFishbrainPage } from './pages/CompareFishbrainPage';
import { CompareFishAnglerPage } from './pages/CompareFishAnglerPage';

const FishDimensionEstimator = React.lazy(() => import('./components/FishDimensionEstimator').then(m => ({ default: m.FishDimensionEstimator })));
const CatchLogbookView = React.lazy(() => import('./components/CatchLogbookView').then(m => ({ default: m.CatchLogbookView })));
const SpotTrackerMap = React.lazy(() => import('./components/SpotTrackerMap').then(m => ({ default: m.SpotTrackerMap })));
const TackleAssistantView = React.lazy(() => import('./components/TackleAssistantView').then(m => ({ default: m.TackleAssistantView })));
const BeginnerGuideView = React.lazy(() => import('./components/BeginnerGuideView').then(m => ({ default: m.BeginnerGuideView })));
const SolunarActivityView = React.lazy(() => import('./components/SolunarActivityView').then(m => ({ default: m.SolunarActivityView })));
const BarometricTrackerView = React.lazy(() => import('./components/BarometricTrackerView').then(m => ({ default: m.BarometricTrackerView })));
const TackleBoxInventoryView = React.lazy(() => import('./components/TackleBoxInventoryView').then(m => ({ default: m.TackleBoxInventoryView })));
const TrophyWallView = React.lazy(() => import('./components/TrophyWallView').then(m => ({ default: m.TrophyWallView })));
const LivewellTimerView = React.lazy(() => import('./components/LivewellTimerView').then(m => ({ default: m.LivewellTimerView })));
const InsightsView = React.lazy(() => import('./components/InsightsView').then(m => ({ default: m.InsightsView })));
const AssistantView = React.lazy(() => import('./components/AssistantView').then(m => ({ default: m.AssistantView })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));

type TabId = 'REPORT' | 'VISION' | 'LOGBOOK' | 'SPOTS' | 'TACKLE' | 'GUIDE' | 'SOLUNAR' | 'PRESSURE' | 'BOX' | 'TROPHY' | 'LIVEWELL' | 'INSIGHTS' | 'ASSISTANT' | 'SETTINGS';
interface TabDef { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; color: string; }

const PRIMARY_TABS: TabDef[] = [
  { id: 'REPORT', label: 'Fish Report', icon: Gauge, color: 'bg-primary text-primary-foreground' },
  { id: 'VISION', label: 'Vision', icon: Camera, color: 'bg-primary text-primary-foreground' },
  { id: 'LOGBOOK', label: 'Logbook', icon: BookOpen, color: 'bg-primary text-primary-foreground' },
  { id: 'INSIGHTS', label: 'Insights', icon: Brain, color: 'bg-primary text-primary-foreground' },
  { id: 'SPOTS', label: 'Spot Map', icon: MapPin, color: 'bg-primary text-primary-foreground' },
];
const MORE_TABS: TabDef[] = [
  { id: 'ASSISTANT', label: 'Assistant', icon: Bot, color: 'bg-primary text-primary-foreground' },
  { id: 'TACKLE', label: 'Tackle AI', icon: Sparkles, color: 'bg-primary text-primary-foreground' },
  { id: 'SOLUNAR', label: 'Solunar', icon: Moon, color: 'bg-primary text-primary-foreground' },
  { id: 'PRESSURE', label: 'Pressure', icon: TrendingDown, color: 'bg-primary text-primary-foreground' },
  { id: 'BOX', label: 'Tackle Box', icon: Package, color: 'bg-primary text-primary-foreground' },
  { id: 'TROPHY', label: 'Trophies', icon: Trophy, color: 'bg-primary text-primary-foreground' },
  { id: 'LIVEWELL', label: 'Livewell', icon: Timer, color: 'bg-primary text-primary-foreground' },
  { id: 'GUIDE', label: 'Academy', icon: GraduationCap, color: 'bg-primary text-primary-foreground' },
  { id: 'SETTINGS', label: 'Settings', icon: Settings, color: 'bg-primary text-primary-foreground' },
];
const MORE_IDS = new Set(MORE_TABS.map(t => t.id));

function useAppState() {
  const [activeTab, setActiveTab] = React.useState<TabId>('VISION');
  const [catches, setCatches] = React.useState<CatchLogItem[]>([]);
  const [spots, setSpots] = React.useState<FishingSpot[]>([]);
  const [signedIn, setSignedIn] = React.useState<boolean>(isSignedIn());
  const [showSignIn, setShowSignIn] = React.useState<boolean>(false);
  const [moreOpen, setMoreOpen] = React.useState<boolean>(false);
  const [proFromHeader, setProFromHeader] = React.useState<boolean>(false);
  const [profile, setProfile] = React.useState<AnglerProfile>(() => loadProfile());
  const [setupOpen, setSetupOpen] = React.useState<boolean>(false);
  React.useEffect(() => { setCatches(loadStoredCatches()); setSpots(loadStoredSpots()); }, []);
  return { activeTab, setActiveTab, catches, setCatches, spots, setSpots, signedIn, setSignedIn, showSignIn, setShowSignIn, moreOpen, setMoreOpen, proFromHeader, setProFromHeader, profile, setProfile, setupOpen, setSetupOpen };
}

function SeoLanding({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl sm:text-5xl font-display font-black uppercase tracking-tight text-white leading-none">fish<span className="text-emerald-400">AI</span></h1>
      <p className="mt-3 text-slate-300 text-sm sm:text-base">the fishing app built around one rule: make the next cast smarter than the last one.</p>
      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        {[
          ['AI Fish ID', 'snap a photo, get species, size, legality.'],
          ['Logbook + Insights', 'every catch makes your predictions better.'],
          ['Spot Map + Solunar', 'real conditions, real times, real spots.'],
        ].map(([t,d]) => (
          <div key={t} className="bg-slate-900 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-400">{t}</div>
            <div className="mt-1 text-sm text-slate-300">{d}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={onStart} className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"><Sparkles className="w-4 h-4" />open the app</button>
        <a href="/blog" className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-wider border border-white/20">read the blog</a>
        <a href="/best-fishing-app" className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-wider border border-white/20">why fishai wins</a>
      </div>
    </div>
  );
}

function BlogIndex({ onStart }: { onStart: () => void }) {
  const posts = [
    { slug: 'ai-fish-id-accuracy-2026', title: 'AI fish ID accuracy in 2026: what anglers should know' },
    { slug: 'best-ai-fishing-app-2026', title: 'Best AI fishing apps 2026: fishAI vs fishbrain vs fishangler' },
    { slug: 'solunar-clock-vs-app', title: 'Solunar clocks vs apps: why built-in math beats random charts' },
    { slug: 'logbook-seo', title: 'Why a private logbook is the secret advantage most anglers ignore' },
  ];
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">journal</h1>
      <p className="mt-2 text-slate-400 text-sm">short guides, comparisons, and real notes from the field.</p>
      <div className="mt-6 grid gap-3">
        {posts.map(p => (
          <a key={p.slug} href={`/blog/${p.slug}`} className="block bg-slate-900 border border-white/10 rounded-2xl p-4 hover:border-emerald-500/40 transition-colors">
            <div className="text-sm font-black text-white">{p.title}</div>
            <div className="mt-1 text-xs text-slate-400">open</div>
          </a>
        ))}
      </div>
      <div className="mt-6">
        <button onClick={onStart} className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-wider border border-white/20">back to app</button>
      </div>
    </div>
  );
}

function BlogPost({ slug, onStart }: { slug: string; onStart: () => void }) {
  const map: Record<string, { title: string; body: string[] }> = {
    'ai-fish-id-accuracy-2026': {
      title: 'AI fish ID accuracy in 2026: what anglers should know',
      body: [
        'AI fish ID works best when you control the inputs: clean light, side profile, scale reference.',
        'fishAI uses Gemini vision plus real species data. it tells you when confidence is low.',
        'the biggest mistake anglers make is treating AI ID as legal proof. it is not. use it as a fast filter, then verify with regs.'
      ]
    },
    'best-ai-fishing-app-2026': {
      title: 'Best AI fishing apps 2026: fishAI vs fishbrain vs fishangler',
      body: [
        'fishbrain and fishangler are spot maps with social feeds. fishAI is a personal intelligence layer: weather, solunar, logbook, insights, assistant, vision, legality.',
        'the difference shows up when you ask why. fishAI answers from your catches, your spots, and real conditions.',
        'if you want a single app that replaces five notebooks, fishAI is the pick.'
      ]
    },
    'solunar-clock-vs-app': {
      title: 'Solunar clocks vs apps: why built-in math beats random charts',
      body: [
        'cheap solunar clocks hardcode tables. fishAI computes sunrise, sunset, moon phase, and major/minor windows from your exact spot and date.',
        'pressure trends, weather overlap, and your own catch history make the real difference.'
      ]
    },
    'logbook-seo': {
      title: 'Why a private logbook is the secret advantage most anglers ignore',
      body: [
        'public logbooks leak your spots. fishAI keeps your logbook local by default.',
        'over time, your personal bests, top lures, and best conditions become a competitive advantage no forum thread can match.'
      ]
    }
  };
  const post = map[slug] || { title: 'post', body: ['coming soon.'] };
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">{post.title}</h1>
      <div className="mt-6 space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">{post.body.map((p,i) => <p key={i}>{p}</p>)}</div>
      <div className="mt-8 flex gap-3">
        <a href="/blog" className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-wider border border-white/20">all posts</a>
        <button onClick={onStart} className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg">open fishAI</button>
      </div>
    </div>
  );
}

function BestFishingApp({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">why fishAI is the best fishing app</h1>
      <p className="mt-3 text-slate-300 text-sm sm:text-base">most fishing apps sell maps. fishAI sells answers.</p>
      <div className="mt-6 grid gap-3">
        {[
          ['real weather + solunar', 'open-meteo + exact astronomical math for your spot and date.'],
          ['personal logbook', 'every catch improves your predictions. private by default.'],
          ['AI vision', 'species, size, and a confidence score. honest when it is unsure.'],
          ['assistant', 'answers from your data, not generic articles.'],
          ['tackle + pressure + academy', 'gear inventory, live barometric trend, beginner guides.'],
        ].map(([t,d]) => (
          <div key={t} className="bg-slate-900 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-400">{t}</div>
            <div className="mt-1 text-sm text-slate-300">{d}</div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button onClick={onStart} className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg">open fishAI</button>
      </div>
    </div>
  );
}

function AcademyIndex({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">academy</h1>
      <p className="mt-2 text-slate-400 text-sm">beginner-friendly guides written by anglers, not AI content mills.</p>
      <div className="mt-6 grid gap-3">
        {[
          ['how to measure a fish with AI', 'lighting, angle, and confidence.'],
          ['solunar basics', 'major periods, minor periods, and weather overlap.'],
          ['reading pressure for bites', 'falling pressure, rising pressure, stable.'],
          ['logbook habits that work', '5 fields to log after every cast.'],
        ].map(([t,d]) => (
          <div key={t} className="bg-slate-900 border border-white/10 rounded-2xl p-4">
            <div className="text-sm font-black text-white">{t}</div>
            <div className="mt-1 text-xs text-slate-400">{d}</div>
          </div>
        ))}
      </div>
      <div className="mt-6"><button onClick={onStart} className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-wider border border-white/20">back to app</button></div>
    </div>
  );
}

export function AppRoutes() {
  const state = useAppState();
  const { activeTab, setActiveTab, catches, setCatches, spots, setSpots, signedIn, setSignedIn, showSignIn, setShowSignIn, moreOpen, setMoreOpen, proFromHeader, setProFromHeader, profile, setProfile, setupOpen, setSetupOpen } = state;

  const handleSaveCatch = (newCatchData: Omit<CatchLogItem, 'id' | 'timestamp' | 'formattedDate'>) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() + ' • ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const newCatch: CatchLogItem = { ...newCatchData, id: `catch-${Date.now()}`, timestamp: now.toISOString(), formattedDate };
    const updated = [newCatch, ...catches];
    setCatches(updated); saveStoredCatches(updated);
    const matchingSpot = spots.find((s) => s.name.toLowerCase() === newCatchData.locationName.toLowerCase());
    if (matchingSpot) { const us = spots.map((s) => (s.id === matchingSpot.id ? { ...s, totalCatches: s.totalCatches + 1 } : s)); setSpots(us); saveStoredSpots(us); }
  };

  const handleDeleteCatch = (id: string) => { const updated = catches.filter((c) => c.id !== id); setCatches(updated); saveStoredCatches(updated); };
  const handleAddSpot = (spotData: Omit<FishingSpot, 'id' | 'totalCatches'>) => {
    const newSpot: FishingSpot = { ...spotData, id: `spot-${Date.now()}`, totalCatches: 0 };
    const updated = [...spots, newSpot]; setSpots(updated); saveStoredSpots(updated);
  };

  const goTo = (tab: TabId) => { setActiveTab(tab); setMoreOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const renderTabButton = (tab: TabDef) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return (
      <button key={tab.id} onClick={() => goTo(tab.id)} className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors flex items-center gap-1.5 shrink-0 ${isActive ? `${tab.color} shadow-md` : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" /><span className="text-[11px] sm:text-xs whitespace-nowrap">{tab.label}</span>
      </button>
    );
  };

  const moreActive = MORE_IDS.has(activeTab);

  return (
    <>
      <GlobalSeo />
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => goTo('VISION')}>
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground glow-emerald"><Fish className="w-5 h-5 stroke-[2.5]" /></div>
            <div><h1 className="text-base font-display font-bold tracking-tight text-foreground leading-none">FishAI</h1><span className="text-[10px] text-muted-foreground hidden sm:block">Snap it. Know it.</span></div>
          </div>
          <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0 justify-end">
            {PRIMARY_TABS.map(renderTabButton)}
            <div className="relative">
              <button onClick={() => setMoreOpen(v => !v)} className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors flex items-center gap-1.5 shrink-0 ${moreActive || moreOpen ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" /><span className="text-[11px] sm:text-xs whitespace-nowrap">More</span><ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (<><div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} /><div className="absolute right-0 top-full mt-2 z-20 w-72 bg-card border border-border rounded-xl shadow-2xl p-2 grid grid-cols-3 gap-1">{MORE_TABS.map(tab => { const Icon = tab.icon; const isActive = activeTab === tab.id; return <button key={tab.id} onClick={() => goTo(tab.id)} className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${isActive ? `${tab.color}` : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}><Icon className="w-4 h-4" /><span className="whitespace-nowrap">{tab.label}</span></button>; })}</div></>)}
            </div>
          </nav>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {!signedIn && (<button onClick={() => { goTo('VISION'); setProFromHeader(true); }} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 hover:brightness-110"><Sparkles className="w-3.5 h-3.5" />Try PRO</button>)}
            {signedIn ? (<button onClick={() => { if (window.confirm('Sign out of owner mode? AI analysis will be locked until you sign in again.')) { signOut(); setSignedIn(false); }}} className="px-3 py-2 rounded-lg border border-primary/40 text-primary text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5" title="Tap to sign out"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />Owner</button>) : (<button onClick={() => setShowSignIn(true)} className="px-3 py-2 rounded-lg border border-border text-foreground text-xs font-semibold uppercase tracking-widest hover:border-primary">Sign In</button>)}
          </div>
          <div className="md:hidden flex items-center gap-2 shrink-0">
            {signedIn ? (<button onClick={() => { if (window.confirm('Sign out of owner mode?')) { signOut(); setSignedIn(false); }}} className="px-2.5 py-1.5 rounded-lg border border-primary/40 text-primary font-semibold text-[10px] uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />Owner</button>) : (<button onClick={() => { goTo('VISION'); setProFromHeader(true); }} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-[10px] uppercase tracking-widest flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />Try PRO</button>)}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-8">
        {activeTab === 'VISION' && <LandingHero onSnap={() => document.getElementById('vision-board')?.scrollIntoView({ behavior: 'smooth' })} />}
        <Suspense fallback={<div className="py-24 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">Loading…</div>}>
          {activeTab === 'REPORT' && (
            hasHomeWater(profile) && !setupOpen ? (
              <DailyReport profile={profile} onEdit={() => setSetupOpen(true)} />
            ) : (
              <div>
                {!hasHomeWater(profile) && (
                  <div className="mb-8 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                      First run · 30 seconds
                    </p>
                    <h2 className="headline mx-auto mt-3 max-w-xl text-center text-3xl sm:text-5xl">
                      Set your water, get your report.
                    </h2>
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
        </Suspense>
        {activeTab === 'VISION' && <LearningLoop />}
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Fish className="w-4 h-4 text-primary" /><span className="font-semibold text-foreground">FishAI</span></div>
          <span>13 integrated fishing modules · Real weather, solunar math & a personal learning loop</span>
        </div>
      </footer>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {PRIMARY_TABS.slice(0, 4).map(tab => { const Icon = tab.icon; const isActive = activeTab === tab.id; return <button key={tab.id} onClick={() => goTo(tab.id)} className={`flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-semibold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-muted-foreground'}`}><Icon className="w-5 h-5" />{tab.label}</button>; })}
          <button onClick={() => setMoreOpen(v => !v)} className={`flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-semibold uppercase tracking-wider ${moreActive || moreOpen ? 'text-primary' : 'text-muted-foreground'}`}><LayoutGrid className="w-5 h-5" />More</button>
        </div>
        {moreOpen && (<div className="absolute bottom-full inset-x-0 bg-card border-t border-border rounded-t-2xl shadow-2xl p-3 pb-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between px-1 pb-2"><span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">All tools</span><button onClick={() => setMoreOpen(false)} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">Close</button></div>
          <div className="grid grid-cols-3 gap-1.5">{[...PRIMARY_TABS.slice(4), ...MORE_TABS].map(tab => { const Icon = tab.icon; const isActive = activeTab === tab.id; return <button key={tab.id} onClick={() => goTo(tab.id)} className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-[10px] font-semibold uppercase tracking-wider ${isActive ? `${tab.color}` : 'text-muted-foreground hover:bg-secondary'}`}><Icon className="w-5 h-5" /><span className="whitespace-nowrap">{tab.label}</span></button>; })}</div>
          {!signedIn && <button onClick={() => { setMoreOpen(false); setShowSignIn(true); }} className="mt-2 w-full py-2.5 rounded-xl border border-primary/40 text-primary font-semibold text-[10px] uppercase tracking-widest">Owner Sign In</button>}
        </div>)}
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
        <Route path="/blog/:slug" element={<BlogPost slug={window.location.pathname.replace('/blog/','')} onStart={() => window.location.assign('/')} />} />
        <Route path="/best-fishing-app" element={<BestFishingApp onStart={() => window.location.assign('/')} />} />
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
