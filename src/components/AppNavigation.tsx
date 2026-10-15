import type { ComponentType } from 'react';
import { ArrowUpRight, ChevronRight, Fish, MapPin, Plus, UserRound } from 'lucide-react';

interface NavigationTab {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface AppNavigationProps {
  tabs: NavigationTab[];
  activeTab: string;
  location?: string;
  signedIn: boolean;
  onNavigate: (id: string) => void;
  onAccount: () => void;
  onPro: () => void;
}

export function FishBrand() {
  return <span className="fish-brand">Fish<span>AI</span><span className="brand-rule" aria-hidden="true" /></span>;
}

export function AppNavigation({ tabs, activeTab, location, signedIn, onNavigate, onAccount, onPro }: AppNavigationProps) {
  const groups = [
    { label: 'Your water', ids: ['REPORT', 'VISION', 'LOGBOOK', 'AREAS', 'SPOTS', 'INSIGHTS'] },
    { label: 'On the water', ids: ['ASSISTANT', 'TACKLE', 'SOLUNAR', 'PRESSURE', 'BOX', 'TROPHY', 'LIVEWELL'] },
    { label: 'Resources', ids: ['GUIDE', 'SHOP', 'SETTINGS'] },
  ];
  const active = tabs.find(tab => tab.id === activeTab);
  return <>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className="app-sidebar">
      <button type="button" className="sidebar-brand" onClick={() => onNavigate('REPORT')} aria-label="FishAI daily report"><FishBrand /></button>
      <div className="sidebar-tagline">Make the next cast count.</div>
      <nav aria-label="Main navigation" className="sidebar-navigation">
        {groups.map(group => <div className="sidebar-group" key={group.label}>
          <p className="nav-label">{group.label}</p>
          {group.ids.map(id => {
            const tab = tabs.find(item => item.id === id);
            if (!tab) return null;
            const Icon = tab.icon;
            return <button type="button" key={id} className="sidebar-link" aria-current={activeTab === id ? 'page' : undefined} onClick={() => onNavigate(id)}>
              <Icon className="size-4" /><span>{tab.label}</span>{activeTab === id && <ChevronRight className="nav-chevron size-3.5" />}
            </button>;
          })}
        </div>)}
      </nav>
      <div className="sidebar-bottom"><Fish className="size-5" /><p>Your water.<br /><strong>Your next move.</strong></p></div>
    </aside>
    <header className="app-topbar">
      <button type="button" className="mobile-brand" onClick={() => onNavigate('REPORT')} aria-label="FishAI daily report"><FishBrand /></button>
      <div className="topbar-breadcrumb"><span>Workspace</span><ChevronRight className="size-3.5" /><strong>{active?.label}</strong></div>
      <div className="topbar-actions">
        {location && <span className="topbar-location"><MapPin className="size-3.5" />{location}</span>}
        <button type="button" className="topbar-log" onClick={() => onNavigate('LOGBOOK')}><Plus className="size-4" /><span>Log a catch</span></button>
        {!signedIn && <button type="button" className="topbar-pro" onClick={onPro}>Try Pro<ArrowUpRight className="size-3.5" /></button>}
        <button type="button" className="account-button" onClick={onAccount} aria-label={signedIn ? 'Sign out of owner mode' : 'Owner sign in'} title={signedIn ? 'Owner: sign out' : 'Owner sign in'}><UserRound className="size-4" /><span className="account-label">{signedIn ? 'Owner' : 'Sign in'}</span></button>
      </div>
    </header>
  </>;
}
