import React from 'react';
import { JsonLd } from './JsonLd';

const site = {
  name: 'FishAI',
  url: 'https://fishai.shop',
  description: 'Fishing tools for AI-assisted fish identification, personal catch logging, weather, solunar timing, pressure trends, spots, tackle, and insights.',
};

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.name,
  url: site.url,
  description: site.description,
};

const software = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: site.name,
  url: site.url,
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Web',
  description: site.description,
  offers: [
    {
      '@type': 'Offer',
      name: 'FishAI Core',
      price: '0',
      priceCurrency: 'USD',
    },
    {
      '@type': 'Offer',
      name: 'FishAI Pro',
      price: '7.99',
      priceCurrency: 'USD',
      description: '7-day free trial, then monthly subscription',
    },
  ],
};

export function GlobalSeo() {
  return (
    <>
      <JsonLd data={organization} />
      <JsonLd data={software} />
    </>
  );
}
