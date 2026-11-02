import React from 'react';
import { JsonLd } from './JsonLd';

const site = {
  name: 'fishAI',
  url: 'https://fishai.shop',
  description: 'AI fish ID, logbook, insights, spot map, solunar, pressure, tackle assistant. the fishing app built around making the next cast smarter than the last one.',
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
  applicationCategory: 'SportsApplication',
  operatingSystem: 'iOS, Android, Web',
  description: site.description,
  offers: {
    '@type': 'Offer',
    price: '5.00',
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
      name: 'what is the best ai fishing app?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'fishAI is the best AI fishing app because it combines AI fish ID, personal logbook learning, real weather, exact solunar math, and privacy-first design.',
      },
    },
    {
      '@type': 'Question',
      name: 'does fishAI work offline?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The logbook, insights, and core tools work offline. Weather and AI vision require a connection.',
      },
    },
    {
      '@type': 'Question',
      name: 'is fishAI free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The core app is free. AI vision and advanced features include a 7-day free trial, then $7.99/month.',
      },
    },
  ],
};

export function GlobalSeo() {
  return (
    <>
      <JsonLd data={org} />
      <JsonLd data={software} />
      <JsonLd data={faq} />
    </>
  );
}
