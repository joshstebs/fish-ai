import React from 'react';
import { renderToString } from 'react-dom/server';
import { AcademyIndex, AppRoutes, BestFishingApp, BlogIndex, BlogPost, SeoLanding } from './App';
import { PublicPageLayout } from './components/PublicPageLayout';
import { ShopView } from './components/ShopView';
import { ProductLandingPage } from './pages/ProductLandingPage';
import { ListiclePage } from './pages/ListiclePage';
import { HowToChoosePage } from './pages/HowToChoosePage';
import { CompareFishbrainPage } from './pages/CompareFishbrainPage';
import { CompareFishAnglerPage } from './pages/CompareFishAnglerPage';
import { OntarioFishingGuidePage } from './pages/OntarioFishingGuidePage';
import { OntarioFishStockingRecordsPage } from './pages/OntarioFishStockingRecordsPage';
import { OntarioFishingLicenceChecklistPage } from './pages/OntarioFishingLicenceChecklistPage';
import { OntarioFishingAccessGuidePage } from './pages/OntarioFishingAccessGuidePage';

// Render the same public components as the client. Personal app state stays on
// the device; the homepage renders only its default signed-out setup screen.
export function renderPublicSeo(path: string): string {
  const onStart = () => {};
  const pages: Record<string, React.ReactElement> = {
    '/': <AppRoutes />,
    '/blog': <BlogIndex onStart={onStart} />,
    '/guides/best-fishing-app-ontario': <OntarioFishingGuidePage />,
    '/guides/ontario-fish-stocking-records': <OntarioFishStockingRecordsPage />,
    '/guides/ontario-fishing-licence-checklist': <OntarioFishingLicenceChecklistPage />,
    '/guides/ontario-fishing-access': <OntarioFishingAccessGuidePage />,
    '/best-fishing-app': <BestFishingApp onStart={onStart} />,
    '/listicle': <ListiclePage onStart={onStart} />,
    '/how-to-choose': <HowToChoosePage onStart={onStart} />,
    '/fishai-vs-fishbrain': <CompareFishbrainPage onStart={onStart} />,
    '/fishai-vs-fishangler': <CompareFishAnglerPage onStart={onStart} />,
    '/academy': <AcademyIndex onStart={onStart} />,
    '/seo': <SeoLanding onStart={onStart} />,
    '/shop': <div className="min-h-screen bg-slate-950 px-4 py-8"><div className="max-w-7xl mx-auto"><ShopView /></div></div>,
  };
  const page = path.startsWith('/blog/')
    ? <BlogPost slug={path.slice('/blog/'.length)} onStart={onStart} />
    : path.startsWith('/shop/')
      ? <ProductLandingPage productId={path.slice('/shop/'.length)} />
      : pages[path];
  if (!page) throw new Error(`No public renderer for ${path}`);
  const html = renderToString(path === '/' ? page : <PublicPageLayout>{page}</PublicPageLayout>);
  if (!/<h1\b/i.test(html)) throw new Error(`Missing public heading for ${path}`);
  if (html.includes('Product not found')) throw new Error(`Unknown product: ${path}`);
  return html;
}

