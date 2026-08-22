#!/usr/bin/env node
/**
 * FishAI static prerender (postbuild)
 * --------------------------------
 * WHY: fishai.shop is a client-rendered React SPA. Every route served the same
 * index.html shell (same title/meta/canonical pointing at /), so Google saw 12
 * duplicate homepage URLs -> "not indexed". This script emits one real static
 * HTML file per route after `vite build`, with unique title, description,
 * canonical, OG/Twitter tags AND the page's actual text inline (so the text is
 * crawlable without executing JS). Vercel serves the static file before the
 * `/(.*) -> /index.html` rewrite, so real users get the same SPA (bundle still
 * mounts and rewrites #root), and crawlers get unique crawlable content.
 *
 * Content below is REAL copy pulled from the app's own pages (src/App.tsx and
 * src/pages/*). No fabricated data.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, '..', 'dist');
const BASE = 'https://fishai.shop';

// Route metadata: title, description, text (visible copy for crawlers)
const ROUTES = [
  {
    path: '/',
    title: 'FishAI — AI Fishing App: Catch Estimator, Weather & Logbook',
    desc: 'Free fishing app with an AI catch estimator (species ID + size from a photo), live barometric pressure, real solunar tables, GPS spot map and catch logbook.',
    text: ['AI Fish ID: snap a photo, get species, size, legality.', 'Logbook + Insights: every catch makes your predictions better.', 'Spot Map + Solunar: real conditions, real times, real spots.'],
  },
  {
    path: '/best-fishing-app',
    title: 'Why FishAI is the best fishing app in 2026',
    desc: 'Most fishing apps sell maps. FishAI sells answers: real weather, real solunar math, a personal logbook, AI vision and an assistant that answers from your own catches.',
    text: ['most fishing apps sell maps. fishAI sells answers.', 'real weather + solunar: open-meteo + exact astronomical math for your spot and date.', 'personal logbook: every catch improves your predictions, private by default.', 'AI vision: species, size, and a confidence score, honest when unsure.', 'assistant: answers from your data, not generic articles.', 'tackle + pressure + academy: gear inventory, live barometric trend, beginner guides.'],
  },
  {
    path: '/fishai-vs-fishbrain',
    title: 'FishAI vs Fishbrain — honest 2026 comparison',
    desc: 'Fishbrain is a social map with a noisy feed and public data. FishAI is a personal fishing intelligence system built around your species, your spots and your catch history.',
    text: ['fishbrain is a social map. fishAI is a personal fishing intelligence system.'],
  },
  {
    path: '/fishai-vs-fishangler',
    title: 'FishAI vs Fishangler — honest 2026 comparison',
    desc: 'Fishangler is maps plus forecasts. FishAI is your personal fishing coach: live conditions, solunar math, private logbook, AI fish ID and insights from your own catches.',
    text: ['fishangler is maps + forecasts. fishAI is your personal fishing coach.'],
  },
  {
    path: '/listicle',
    title: 'Best fishing apps 2026: the complete list, tested',
    desc: 'We tested every major fishing app and ranked them by what matters to anglers: real data, personalization, privacy. Updated August 2026.',
    text: ['we tested every major fishing app. here is the actual list, ranked by what matters most to anglers.', 'fishbrain: best social fishing map, huge user base, but noisy feed and public data by default.', 'fishangler: best free forecast + map combo, weak on AI and personal insights.', 'fishAI: best personal fishing intelligence, live conditions and private logbook.', 'updated august 2026. we test each app for at least 30 days before ranking.'],
  },
  {
    path: '/how-to-choose',
    title: 'How to choose a fishing app in 2026',
    desc: 'Most fishing apps solve one problem. The best fishing app solves five: live conditions, solunar math, a private logbook, AI identification and personal insights.',
    text: ['most fishing apps solve one problem. the best fishing app solves five.', 'fishAI is the only fishing app built around all five.'],
  },
  {
    path: '/blog',
    title: 'FishAI Journal — fishing guides, comparisons and field notes',
    desc: 'Short, honest guides: AI fish ID accuracy, best fishing app comparisons, solunar clocks vs apps, and why a private logbook is your secret advantage.',
    text: ['short guides, comparisons, and real notes from the field.'],
  },
  {
    path: '/blog/ai-fish-id-accuracy-2026',
    title: 'AI fish ID accuracy in 2026: what anglers should know',
    desc: 'AI fish ID works best when you control the inputs. FishAI uses Gemini vision plus real species data and tells you when confidence is low.',
    text: ['AI fish ID works best when you control the inputs: clean light, side profile, scale reference.', 'fishAI uses Gemini vision plus real species data. it tells you when confidence is low.', 'the biggest mistake anglers make is treating AI ID as legal proof. use it as a fast filter, then verify with regs.'],
  },
  {
    path: '/blog/best-ai-fishing-app-2026',
    title: 'Best AI fishing apps 2026: FishAI vs Fishbrain vs Fishangler',
    desc: 'Fishbrain and Fishangler are spot maps with social feeds. FishAI is a personal intelligence layer: weather, solunar, logbook, insights, assistant, vision, legality.',
    text: ['fishbrain and fishangler are spot maps with social feeds. fishAI is a personal intelligence layer: weather, solunar, logbook, insights, assistant, vision, legality.', 'the difference shows up when you ask why. fishAI answers from your catches, your spots, and real conditions.', 'if you want a single app that replaces five notebooks, fishAI is the pick.'],
  },
  {
    path: '/blog/solunar-clock-vs-app',
    title: 'Solunar clocks vs apps: why built-in math beats random charts',
    desc: 'Cheap solunar clocks hardcode tables. FishAI computes sunrise, sunset, moon phase and major/minor windows from your exact spot and date.',
    text: ['cheap solunar clocks hardcode tables. fishAI computes sunrise, sunset, moon phase, and major/minor windows from your exact spot and date.', 'pressure trends, weather overlap, and your own catch history make the real difference.'],
  },
  {
    path: '/blog/logbook-seo',
    title: 'Why a private logbook is the secret advantage most anglers ignore',
    desc: 'Public logbooks leak your spots. FishAI keeps your logbook local by default, and your personal bests become a competitive advantage.',
    text: ['public logbooks leak your spots. fishAI keeps your logbook local by default.', 'over time, your personal bests, top lures, and best conditions become a competitive advantage no forum thread can match.'],
  },
  {
    path: '/academy',
    title: 'FishAI Academy — beginner fishing guides',
    desc: 'Beginner-friendly guides written by anglers: how to measure a fish with AI, solunar basics, reading pressure for bites, and logbook habits that work.',
    text: ['how to measure a fish with AI: lighting, angle, and confidence.', 'solunar basics: major periods, minor periods, and weather overlap.', 'reading pressure for bites: falling pressure, rising pressure, stable.', 'logbook habits that work: 5 fields to log after every cast.'],
  },
  {
    path: '/seo',
    title: 'FishAI — AI Fishing App: Catch Estimator, Weather & Logbook',
    desc: 'The fishing app built around one rule: make the next cast smarter than the last one. Free AI catch estimator, real solunar + weather, private logbook.',
    text: ['AI Fish ID: snap a photo, get species, size, legality.', 'Logbook + Insights: every catch makes your predictions better.', 'Spot Map + Solunar: real conditions, real times, real spots.'],
  },
];

const shell = readFileSync(join(dist, 'index.html'), 'utf-8');
const assetBase = '/'; // assets served from root

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

let count = 0;
for (const r of ROUTES) {
  const url = r.path === '/' ? BASE : BASE + r.path;
  let html = shell;
  html = html.replace(/<title>.*?<\/title>/, `<title>${esc(r.title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${esc(r.desc)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${esc(r.title)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${esc(r.desc)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"[\s\S]*?\/>/,
    `<meta property="og:url" content="${url}" />`
  );
  html = html.replace(
    /<link\s+rel="canonical"[\s\S]*?\/>/,
    `<link rel="canonical" href="${url}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"[\s\S]*?\/>/,
    `<meta name="twitter:title" content="${esc(r.title)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[\s\S]*?\/>/,
    `<meta name="twitter:description" content="${esc(r.desc)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:url"[\s\S]*?\/>/,
    `<meta name="twitter:url" content="${url}" />`
  );
  // Inject crawlable text inside #root; the SPA bundle replaces it on mount.
  const bodyText = `<div style="position:absolute;left:-9999px;top:-9999px" aria-hidden="true">${r.text
    .map((t) => `<p>${esc(t)}</p>`)
    .join('')}</div>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyText}</div>`);

  const outDir = join(dist, r.path === '/' ? '.well-known-tmp' : r.path.slice(1));
  // write real route dir
  const actualDir = join(dist, r.path === '/' ? '' : r.path.slice(1));
  if (actualDir && actualDir !== dist) {
    mkdirSync(actualDir, { recursive: true });
  }
  writeFileSync(join(actualDir || dist, 'index.html'), html);
  count++;
}

console.log(`[prerender] wrote ${count} static pages into ${dist}`);
