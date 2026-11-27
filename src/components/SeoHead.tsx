import React from 'react';
import { JsonLd } from './JsonLd';

const site = {
  name: 'FishAI',
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

export function GlobalSeo() {
  return <JsonLd data={org} />;
}
