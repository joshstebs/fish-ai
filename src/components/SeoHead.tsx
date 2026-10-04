import React from 'react';
import { useLocation } from 'react-router-dom';
import { JsonLd } from './JsonLd';
import { CATEGORY_LABELS, MERCH_PRODUCTS, formatCad } from '../data/merch';

const site = {
  name: 'FishAI',
  url: 'https://fishai.shop',
  description: 'AI fish ID, fishing weather, solunar times, private logbook, spot map and angler insights for smarter fishing.',
  image: 'https://fishai.shop/og-image.png',
};

const org = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FishAI',
  url: site.url,
  description: site.description,
};

const software = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FishAI',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'iOS, Android, Web',
  description: site.description,
  offers: {
    '@type': 'Offer',
    price: '7.99',
    priceCurrency: 'USD',
    description: '7-day free trial, then $7.99/month',
  },
};

const faq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What can FishAI do for anglers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FishAI combines AI fish identification, a private fishing logbook, live conditions, solunar timing, spot mapping and personal catch insights.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does FishAI work offline?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The logbook, insights and core tools work offline. Weather and AI vision require a connection.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is FishAI free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The core app is free. AI vision and advanced features include a 7-day free trial, then $7.99/month.',
      },
    },
  ],
};

type SeoConfig = {
  title: string;
  description: string;
  image?: string;
  type?: string;
  robots?: string;
};

const ROUTES: Record<string, SeoConfig> = {
  '/': {
    title: 'FishAI — AI Fishing App for Fish ID, Weather, Solunar & Logbook',
    description: 'Fish smarter with AI fish identification, fishing weather, solunar times, a private catch logbook, spot map and personal angler insights.',
  },
  '/blog': {
    title: 'Fishing Guides, AI Fish ID & Angling Tips | FishAI',
    description: 'Practical fishing guides on AI fish identification, solunar timing, fishing logbooks, conditions and smarter trip planning.',
  },
  '/best-fishing-app': {
    title: 'Best Fishing App for AI Fish ID, Weather & Logbook | FishAI',
    description: 'Compare the fishing tools that matter: AI fish ID, weather, solunar timing, private catch logging, spots and personal insights.',
  },
  '/listicle': {
    title: 'Fishing Apps & Tools Worth Using in 2026 | FishAI',
    description: 'A practical look at fishing apps and tools for fish identification, weather, solunar timing, logging catches and planning trips.',
  },
  '/how-to-choose': {
    title: 'How to Choose a Fishing App | FishAI',
    description: 'What to look for in a fishing app, including fish identification, weather, solunar data, privacy, catch logging and useful insights.',
  },
  '/fishai-vs-fishbrain': {
    title: 'FishAI vs Fishbrain: Fishing App Comparison | FishAI',
    description: 'Compare FishAI and Fishbrain across AI fish ID, catch logging, weather, spot tools, privacy and personalized fishing insights.',
  },
  '/fishai-vs-fishangler': {
    title: 'FishAI vs FishAngler: Fishing App Comparison | FishAI',
    description: 'Compare FishAI and FishAngler across AI fish ID, catch logging, weather, spot tools, privacy and personalized fishing insights.',
  },
  '/academy': {
    title: 'Fishing Academy: Learn Fish ID, Conditions & Technique | FishAI',
    description: 'Learn practical fishing basics, fish identification, conditions, timing, tackle and techniques with FishAI.',
  },
  '/seo': {
    title: 'FishAI Features: AI Fish ID, Solunar, Weather & Logbook',
    description: 'Explore FishAI features for anglers: AI fish identification, fishing weather, solunar timing, private logbook, spot map and personal insights.',
  },
};

const BLOG_ROUTES: Record<string, SeoConfig> = {
  '/blog/ai-fish-id-accuracy-2026': {
    title: 'AI Fish Identification Accuracy in 2026 | FishAI',
    description: 'Learn what affects AI fish identification accuracy, how to take better fish photos and when to verify an identification manually.',
  },
  '/blog/best-ai-fishing-app-2026': {
    title: 'Best AI Fishing Apps in 2026: What to Compare | FishAI',
    description: 'Compare AI fishing apps by fish identification, weather, solunar data, catch logging, privacy and personalized insights.',
  },
  '/blog/solunar-clock-vs-app': {
    title: 'Solunar Clock vs Fishing App: What Changes by Location? | FishAI',
    description: 'Understand how location-aware solunar calculations differ from fixed charts and why local conditions still matter when planning a trip.',
  },
  '/blog/logbook-seo': {
    title: 'Why a Private Fishing Logbook Makes You a Better Angler | FishAI',
    description: 'A private fishing logbook can reveal patterns in species, lures, weather, pressure, timing and locations without exposing your spots.',
  },
};

function upsertMeta(kind: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${kind}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(kind, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(url: string) {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}

export function RouteSeo() {
  const { pathname } = useLocation();
  const productId = pathname.startsWith('/shop/') ? decodeURIComponent(pathname.slice('/shop/'.length)) : '';
  const product = productId ? MERCH_PRODUCTS.find((item) => item.id === productId) : undefined;

  let config = ROUTES[pathname] || BLOG_ROUTES[pathname];
  if (product) {
    config = {
      title: `${product.title} | Ontario Fishing Apparel | FishAI`,
      description: `${product.story} Printed to order in Ontario. ${CATEGORY_LABELS[product.category]}, ${formatCad(product.priceCad)}.`,
      image: `${site.url}${product.image}`,
      type: 'product',
    };
  }

  const resolved = config || {
    title: site.name,
    description: site.description,
    robots: 'noindex,follow',
  };
  const canonicalUrl = product || config ? `${site.url}${pathname === '/' ? '' : pathname}` : site.url;
  const image = resolved.image || site.image;

  React.useEffect(() => {
    document.title = resolved.title;
    upsertMeta('name', 'description', resolved.description);
    upsertMeta('name', 'robots', resolved.robots || 'index,follow,max-image-preview:large');
    upsertMeta('property', 'og:site_name', site.name);
    upsertMeta('property', 'og:title', resolved.title);
    upsertMeta('property', 'og:description', resolved.description);
    upsertMeta('property', 'og:type', resolved.type || 'website');
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:image:alt', product ? product.title : 'FishAI fishing app');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', resolved.title);
    upsertMeta('name', 'twitter:description', resolved.description);
    upsertMeta('name', 'twitter:image', image);
    setCanonical(canonicalUrl);
  }, [canonicalUrl, image, product, resolved.description, resolved.robots, resolved.title, resolved.type]);

  if (!product) return null;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.story,
    image: [`${site.url}${product.image}`],
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'FishAI',
    },
    category: CATEGORY_LABELS[product.category],
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'CAD',
      price: product.priceCad.toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return <JsonLd data={productJsonLd} />;
}

export function GlobalSeo() {
  return (
    <>
      <JsonLd data={org} />
      <JsonLd data={software} />
      <JsonLd data={faq} />
    </>
  );
}
