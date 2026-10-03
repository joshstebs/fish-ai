#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, '..', 'dist');
const base = 'https://fishai.shop';

const routes = [
  {
    path: '/',
    title: 'FishAI - Fishing Logbook, Weather, Solunar & AI Fish ID',
    desc: 'Local-first fishing web app with catch logging, live weather, solunar timing, saved spots, personal insights, and optional AI fish photo analysis.',
    text: ['Log real catches.', 'Inspect live weather and pressure.', 'Calculate solunar timing.', 'Optionally analyze your own fish photo with AI.']
  },
  {
    path: '/best-fishing-app',
    title: 'What FishAI Does - Current Product Overview',
    desc: 'A factual overview of FishAI weather, solunar, local-first logbook, spots, tackle tools and optional AI vision.',
    text: ['Current FishAI capabilities and their data sources.', 'No unverifiable competitor ranking.']
  },
  {
    path: '/listicle',
    title: 'How to Compare Fishing Apps in 2026',
    desc: 'A practical checklist for comparing fishing apps by logging, privacy, live conditions, AI uncertainty and regulation handling.',
    text: ['Compare fishing apps by the workflow and data handling you actually need.']
  },
  {
    path: '/how-to-choose',
    title: 'How to Choose a Fishing App',
    desc: 'Evaluate identification, logging, live data, privacy and regulation handling before choosing a fishing app.',
    text: ['Verify what is live, what is local, what is estimated, and what must come from official regulations.']
  },
  {
    path: '/fishai-vs-fishbrain',
    title: 'FishAI and Fishbrain - Product Focus',
    desc: 'A factual description of FishAI current behavior without freezing competitor features or pricing in time.',
    text: ['FishAI is local-first for catches and saved spots and includes live weather, computed solunar timing and optional AI image analysis.']
  },
  {
    path: '/fishai-vs-fishangler',
    title: 'FishAI and FishAngler - Product Focus',
    desc: 'A factual description of FishAI current behavior without unsupported competitor claims.',
    text: ['FishAI documents its own current behavior and directs users to competitors for their current features and pricing.']
  },
  {
    path: '/blog',
    title: 'FishAI Journal',
    desc: 'Product notes about AI identification limits, fishing app evaluation, solunar timing and local-first logging.',
    text: ['FishAI product notes and fishing-tool explainers.']
  },
  {
    path: '/blog/ai-fish-id-accuracy-2026',
    title: 'AI Fish Identification: Limits and Better Inputs',
    desc: 'Why fish image identification is probabilistic and why visual fish dimensions should be treated as estimates.',
    text: ['AI identification can be wrong.', 'Visual measurements require appropriate uncertainty.']
  },
  {
    path: '/blog/best-ai-fishing-app-2026',
    title: 'How to Compare Fishing Apps Without Marketing Claims',
    desc: 'Choose fishing software by workflow, data sources, privacy and uncertainty rather than unsupported rankings.',
    text: ['Verify current competitor details directly with each provider.']
  },
  {
    path: '/blog/solunar-clock-vs-app',
    title: 'Solunar Timing in FishAI',
    desc: 'How FishAI calculates astronomy-derived timing for selected coordinates and why solunar is only one signal.',
    text: ['FishAI computes astronomy-derived timing for the selected location and date.']
  },
  {
    path: '/blog/logbook-seo',
    title: 'What Local-First Logbook Means in FishAI',
    desc: 'Which FishAI records remain in browser storage and which network features transmit relevant data.',
    text: ['Local-first does not mean network-free.']
  },
  {
    path: '/academy',
    title: 'FishAI Academy',
    desc: 'Beginner reference material for fish photos, solunar timing, pressure and consistent catch logging.',
    text: ['Beginner-friendly reference material built into FishAI.']
  },
  {
    path: '/seo',
    title: 'FishAI - Personal Fishing Intelligence',
    desc: 'Fishing tools centered on your own catches, selected waters and live conditions.',
    text: ['AI fish ID, local-first logbook, live weather and computed solunar timing.']
  }
];

const shell = readFileSync(join(dist, 'index.html'), 'utf8');
const esc = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

for (const route of routes) {
  const url = route.path === '/' ? base + '/' : base + route.path;
  let html = shell
    .replace(/<title>.*?<\/title>/, `<title>${esc(route.title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(route.desc)}" />`)
    .replace(/<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${esc(route.title)}" />`)
    .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${esc(route.desc)}" />`)
    .replace(/<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<link\s+rel="canonical"[\s\S]*?\/>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${esc(route.title)}" />`)
    .replace(/<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${esc(route.desc)}" />`)
    .replace(/<meta\s+name="twitter:url"[\s\S]*?\/>/, `<meta name="twitter:url" content="${url}" />`);

  const crawlable = `<div style="position:absolute;left:-9999px;top:-9999px" aria-hidden="true">${route.text.map((item) => `<p>${esc(item)}</p>`).join('')}</div>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${crawlable}</div>`);

  const target = route.path === '/' ? dist : join(dist, route.path.slice(1));
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'index.html'), html);
}

console.log(`[prerender] wrote ${routes.length} factual static routes`);
