import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';

const DIST = path.resolve('dist');
const SITE = 'https://fishai.shop';
const TODAY = '2026-10-10';

const pages = [
  { path: '/guides/best-fishing-app-ontario', title: 'Ontario Fishing Access Points and App Guide | FishAI', description: 'Search Ontario open data for lake names and recorded fishing access points, then verify property permission, current operation and 2026 regulations.' },
  { path: '/shop', title: 'FishAI Fishing Merch — T-Shirts, Hoodies & Hats', description: 'Original FishAI fishing apparel and hats, printed to order and shipped from Ontario, Canada.' },
  { path: '/best-fishing-app', title: 'FishAI — AI Fishing App with Fish ID, Weather & Logbook', description: 'Compare the tools that make FishAI a practical fishing companion: AI fish ID, weather, solunar timing, private catch logbook, spot map and insights.' },
  { path: '/fishai-vs-fishbrain', title: 'FishAI vs Fishbrain — Fishing App Comparison', description: 'Compare FishAI and Fishbrain across AI fish identification, weather, private catch logging, spot tools and angler-focused features.' },
  { path: '/fishai-vs-fishangler', title: 'FishAI vs FishAngler: Fishing App Comparison', description: 'Compare FishAI and FishAngler maps, catch logs, forecasts and privacy using a practical task table and a repeatable 20-minute trial.' },
  { path: '/listicle', title: 'Best Fishing App Features to Look For in 2026 | FishAI', description: 'A practical checklist for choosing a fishing app in 2026, including weather, solunar data, catch logging, fish identification and privacy.' },
  { path: '/how-to-choose', title: 'How to Choose a Fishing App | FishAI', description: 'Learn what to compare when choosing a fishing app: accurate conditions, useful catch history, fish identification, privacy and real angler workflows.' },
  { path: '/blog', title: 'FishAI Fishing Journal — Guides, Comparisons & Tips', description: 'Fishing guides and practical notes on AI fish identification, solunar timing, private catch logs and choosing fishing apps.' },
  { path: '/blog/ai-fish-id-accuracy-2026', title: 'AI Fish ID Accuracy in 2026: What Anglers Should Know | FishAI', description: 'How to get better AI fish identification results, when confidence drops, and why anglers should still verify regulations and species details.' },
  { path: '/blog/best-ai-fishing-app-2026', title: 'Best AI Fishing Apps 2026: FishAI, Fishbrain & FishAngler', description: 'A feature-focused look at AI fishing apps in 2026, including fish identification, weather, logbooks, maps, privacy and personalized insights.' },
  { path: '/blog/solunar-clock-vs-app', title: 'Solunar Clock vs Fishing App: What Changes? | FishAI', description: 'Compare fixed solunar clocks with location-aware fishing apps that combine moon timing, weather, pressure and your own catch history.' },
  { path: '/blog/logbook-seo', title: 'Why a Private Fishing Logbook Can Be an Advantage | FishAI', description: 'A private fishing logbook helps you keep spots private while learning which conditions, lures and locations produce your best catches.' },
  { path: '/academy', title: 'FishAI Fishing Academy — Beginner Guides', description: 'Beginner-friendly fishing guides covering fish measurement, solunar basics, barometric pressure and better catch-log habits.' },
  { path: '/seo', title: 'FishAI — Smarter Fishing Tools in One App', description: 'Explore FishAI tools for fish identification, private catch logging, weather, solunar timing and smarter fishing decisions.' },
];

function replaceTag(html, selector, replacement) {
  const patterns = {
    title: /<title>[\s\S]*?<\/title>/i,
    description: /<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i,
    ogTitle: /<meta\b(?=[^>]*\bproperty=["']og:title["'])[^>]*>/i,
    ogDescription: /<meta\b(?=[^>]*\bproperty=["']og:description["'])[^>]*>/i,
    ogUrl: /<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>/i,
    ogImage: /<meta\b(?=[^>]*\bproperty=["']og:image["'])[^>]*>/i,
    twitterTitle: /<meta\b(?=[^>]*\bname=["']twitter:title["'])[^>]*>/i,
    twitterDescription: /<meta\b(?=[^>]*\bname=["']twitter:description["'])[^>]*>/i,
    twitterUrl: /<meta\b(?=[^>]*\bname=["']twitter:url["'])[^>]*>/i,
    canonical: /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i,
  };
  const pattern = patterns[selector];
  return pattern.test(html) ? html.replace(pattern, replacement) : html.replace('</head>', '    ' + replacement + '\n  </head>');
}

function pageHtml(template, page) {
  const url = SITE + page.path;
  let html = template;
  html = replaceTag(html, 'title', `<title>${page.title}</title>`);
  html = replaceTag(html, 'description', `<meta name="description" content="${page.description}" />`);
  html = replaceTag(html, 'canonical', `<link rel="canonical" href="${url}" />`);
  html = replaceTag(html, 'ogTitle', `<meta property="og:title" content="${page.title}" />`);
  html = replaceTag(html, 'ogDescription', `<meta property="og:description" content="${page.description}" />`);
  html = replaceTag(html, 'ogUrl', `<meta property="og:url" content="${url}" />`);
  html = replaceTag(html, 'twitterTitle', `<meta name="twitter:title" content="${page.title}" />`);
  html = replaceTag(html, 'twitterDescription', `<meta name="twitter:description" content="${page.description}" />`);
  html = replaceTag(html, 'twitterUrl', `<meta name="twitter:url" content="${url}" />`);
  return html;
}

function decodeStory(value) {
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\'/g, "'")
    .replace(/\\n/g, ' ');
}

const template = await readFile(path.join(DIST, 'index.html'), 'utf8');
const renderer = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
  // Vite 5's SSR resolver predates React Router's module-sync exports.
  resolve: { alias: [
    { find: /^react-router-dom$/, replacement: path.resolve('node_modules/react-router-dom/dist/index.mjs') },
    { find: /^react-router$/, replacement: path.resolve('node_modules/react-router/dist/development/index.mjs') },
  ] },
});
try {
  const { renderPublicSeo } = await renderer.ssrLoadModule('/src/renderPublicSeo.tsx');
  function withPublicContent(html, route) {
    if (!html.includes('<div id="root"></div>')) throw new Error('Missing empty React root in build template');
    return html.replace('<div id="root"></div>', () => `<div id="root">${renderPublicSeo(route)}</div>`);
  }
  await writeFile(path.join(DIST, 'index.html'), withPublicContent(template, '/'));

  for (const page of pages) {
    const html = withPublicContent(pageHtml(template, page), page.path);
    const target = path.join(DIST, page.path.replace(/^\//, '') + '.html');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html);
  }

  const merchSource = await readFile(path.resolve('src/data/merch.ts'), 'utf8');
  const productPattern = /p\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'(tee|hoodie|hat)'\s*,\s*([\d.]+)\s*,\s*'((?:\\.|[^'])*)'/gms;
  const categoryLabels = { tee: 'T-shirt', hoodie: 'Hoodie', hat: 'Trucker Hat' };
  const products = [];
  let match;

  while ((match = productPattern.exec(merchSource)) !== null) {
    const [, id, title, category, price, rawStory] = match;
    products.push({ id, title, category, price: Number(price).toFixed(2), story: decodeStory(rawStory) });
  }

  for (const product of products) {
    const page = {
      path: `/shop/${product.id}`,
      title: `${product.title} | FishAI Fishing Merch`,
      description: `${product.story} ${categoryLabels[product.category]} printed to order in Canada.`,
    };

    let html = pageHtml(template, page)
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');

    const image = `${SITE}/merch/${product.id}.jpg`;
    html = replaceTag(html, 'ogImage', `<meta property="og:image" content="${image}" />`);

    const productJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      image: [image],
      description: product.story,
      sku: product.id,
      brand: { '@type': 'Brand', name: 'FishAI' },
      offers: {
        '@type': 'Offer',
        url: SITE + page.path,
        price: product.price,
        priceCurrency: 'CAD',
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    };

    html = html.replace('</head>', `    <script type="application/ld+json">${JSON.stringify(productJsonLd)}</script>\n  </head>`);
    html = withPublicContent(html, page.path);
    const target = path.join(DIST, page.path.replace(/^\//, '') + '.html');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html);
  }

  const sitemapPath = path.join(DIST, 'sitemap.xml');
  let sitemap = await readFile(sitemapPath, 'utf8');

  if (!sitemap.includes('<loc>https://fishai.shop/shop</loc>')) {
    const shopEntries = [
      `  <url><loc>${SITE}/shop</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`,
      ...products.map((product) => `  <url><loc>${SITE}/shop/${product.id}</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`),
    ].join('\n');
    sitemap = sitemap.replace('</urlset>', shopEntries + '\n</urlset>');
    await writeFile(sitemapPath, sitemap);
  }

  console.log(`Generated ${pages.length} SEO pages and ${products.length} product landing pages.`);
} finally {
  await renderer.close();
}
