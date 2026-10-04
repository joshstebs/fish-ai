import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { JsonLd } from './JsonLd';

const site = {
  name: 'fishAI',
  url: 'https://fishai.shop',
  description: 'AI fish ID, logbook, insights, spot map, solunar, pressure, tackle assistant. The fishing app built around making the next cast smarter than the last one.',
};

const org = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'fishAI',
  url: site.url,
  description: site.description,
};

const software = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'fishAI',
  url: site.url,
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Web',
  description: site.description,
  offers: {
    '@type': 'Offer',
    price: '7.99',
    priceCurrency: 'USD',
    description: '7-day free trial, then $7.99/month',
  },
};

type SeoConfig = {
  title: string;
  description: string;
  robots?: string;
};

const ROUTE_SEO: Record<string, SeoConfig> = {
  '/': {
    title: 'FishAI — AI Fishing App: Catch Estimator, Weather & Logbook',
    description: 'Free fishing app with AI fish identification, catch estimating, live pressure, solunar tables, GPS spots and a private catch logbook.',
  },
  '/best-fishing-app': {
    title: 'Best Fishing App 2026: AI Fish ID, Weather & Logbook | FishAI',
    description: 'Compare the features anglers use most: AI fish ID, live weather, solunar timing, private catch logging, spot tracking and fishing insights.',
  },
  '/fishai-vs-fishbrain': {
    title: 'FishAI vs Fishbrain: Fishing App Comparison | FishAI',
    description: 'Compare FishAI and Fishbrain across AI fish identification, fishing logs, maps, weather, solunar timing, privacy and personalized insights.',
  },
  '/fishai-vs-fishangler': {
    title: 'FishAI vs FishAngler: Fishing App Comparison | FishAI',
    description: 'Compare FishAI and FishAngler across fish ID, catch logging, maps, weather, solunar timing, privacy and personalized fishing insights.',
  },
  '/how-to-choose': {
    title: 'How to Choose a Fishing App: Features That Matter | FishAI',
    description: 'A practical guide to choosing a fishing app based on fish ID, catch logging, maps, weather, solunar data, privacy and useful insights.',
  },
  '/listicle': {
    title: 'Fishing App Features Worth Using in 2026 | FishAI',
    description: 'A practical look at fishing app features that help on the water, including AI fish ID, catch logs, weather, solunar timing and spot tracking.',
  },
  '/blog': {
    title: 'FishAI Fishing Journal: Guides, Comparisons & Tips',
    description: 'Fishing guides and comparisons covering AI fish identification, solunar timing, catch logs, weather, apps and smarter time on the water.',
  },
  '/blog/ai-fish-id-accuracy-2026': {
    title: 'AI Fish ID Accuracy in 2026: What Anglers Should Know | FishAI',
    description: 'How photo quality, angle, lighting and confidence affect AI fish identification, plus why anglers should still verify fishing regulations.',
  },
  '/blog/best-ai-fishing-app-2026': {
    title: 'Best AI Fishing Apps 2026: FishAI, Fishbrain & FishAngler',
    description: 'Compare popular AI fishing apps across fish identification, maps, weather, catch logging, privacy and personalized fishing insights.',
  },
  '/blog/solunar-clock-vs-app': {
    title: 'Solunar Clock vs Fishing App: What Changes on the Water | FishAI',
    description: 'Understand how location, date, moon phase, sunrise, sunset, weather and pressure affect useful solunar timing for anglers.',
  },
  '/blog/logbook-seo': {
    title: 'Private Fishing Logbook: Turn Catch History Into Better Decisions | FishAI',
    description: 'Learn how a private catch log can reveal patterns in spots, lures, weather and conditions without publishing your fishing locations.',
  },
  '/academy': {
    title: 'Fishing Academy: Fish ID, Solunar, Pressure & Logbook Basics | FishAI',
    description: 'Beginner-friendly fishing guides covering AI fish measurement, solunar periods, barometric pressure and useful catch-log habits.',
  },
  '/seo': {
    title: 'FishAI',
    description: site.description,
    robots: 'noindex,follow',
  },
};

function resolveSeo(pathname: string): SeoConfig {
  return ROUTE_SEO[pathname] ?? ROUTE_SEO['/'];
}

function upsertMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function GlobalSeo() {
  const { pathname } = useLocation();
  const seo = resolveSeo(pathname);
  const canonical = `${site.url}${pathname === '/' ? '/' : pathname}`;

  useEffect(() => {
    document.title = seo.title;
    upsertMeta('meta[name="description"]', 'name', 'description', seo.description);
    upsertMeta('meta[name="robots"]', 'name', 'robots', seo.robots ?? 'index,follow');
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', seo.title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', seo.description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', seo.title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description);
    upsertMeta('meta[name="twitter:url"]', 'name', 'twitter:url', canonical);
    upsertCanonical(canonical);
  }, [canonical, seo.description, seo.robots, seo.title]);

  return (
    <>
      <JsonLd data={org} />
      <JsonLd data={software} />
    </>
  );
}
