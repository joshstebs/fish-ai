import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { FishBrand } from './AppNavigation';

export function PublicPageLayout({ children }: { children: ReactNode }) {
  return <div className="public-layout">
    <header className="public-header">
      <a href="/" aria-label="FishAI home"><FishBrand /></a>
      <nav aria-label="Fishing resources">
        <a href="/guides/best-fishing-app-ontario">Field guides</a>
        <a href="/blog">Journal</a>
        <a href="/shop">Merch</a>
        <a href="/" className="public-open">Open FishAI<ArrowUpRight className="size-3.5" /></a>
      </nav>
    </header>
    <div className="public-content">{children}</div>
    <footer className="public-footer"><span>FishAI · Make the next cast count.</span><a href="/">Back to your fishing workspace →</a></footer>
  </div>;
}
