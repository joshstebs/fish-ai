import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

test('every sitemap page contains public content before JavaScript runs', async () => {
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
  assert.ok(urls.length >= 40, 'sitemap unexpectedly lost published pages');
  assert.equal(new Set(urls.map(url => url.href)).size, urls.length, 'sitemap URLs should be unique');
  assert.ok(urls.some(url => url.pathname === '/guides/ontario-fish-stocking-records'), 'stocking guide missing from sitemap');
  assert.ok(urls.some(url => url.pathname === '/guides/ontario-fishing-zones'), 'fishing zones guide missing from sitemap');
  for (const url of urls) {
    const file = url.pathname === '/' ? 'index.html' : `${url.pathname.slice(1)}.html`;
    const html = await readFile(path.join('dist', file), 'utf8');
    assert.match(html, /<h1\b/, url.pathname);
    assert.ok(!html.includes('<div id="root"></div>'), url.pathname);
    assert.ok(html.includes(`href="${url.href}"`), `canonical missing: ${url.pathname}`);
    assert.ok(!html.includes('Product not found'), url.pathname);
  }
});

test('shop HTML exposes the complete catalog and working page links', async () => {
  const html = await readFile('dist/shop.html', 'utf8');
  const products = new Set([...html.matchAll(/href="(\/shop\/[^"/]+)"/g)].map(match => match[1]));
  assert.equal(products.size, 23);
  for (const product of products) {
    const productHtml = await readFile(path.join('dist', `${product.slice(1)}.html`), 'utf8');
    assert.match(productHtml, /<h1[^>]*>[^<]+<\/h1>/);
    assert.match(productHtml, /CAD/);
    assert.match(productHtml, /https:\/\/buy\.stripe\.com\//);
  }
});

test('homepage has the default setup content and retains client bootstrapping', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  assert.match(html, /Set your water, get your report/);
  assert.match(html, /type="module"[^>]*src="\/assets\//);
  assert.ok(!html.includes('Sign-in required to view this page'));
});

test('logbook and Pro landing pages expose specific CTAs and serving routes', async () => {
  const pages = [
    { route: '/fishing-logbook', copy: 'A private fishing logbook', entry: '/?view=logbook' },
    { route: '/pro', copy: 'FishAI Pro for catch photos', entry: '/?view=pro' },
  ];
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  const { rewrites } = JSON.parse(await readFile('vercel.json', 'utf8'));
  const fallback = rewrites.findIndex(({ source }) => source === '/(.*)');

  for (const { route, copy, entry } of pages) {
    const html = await readFile(`dist${route}.html`, 'utf8');
    assert.ok(html.includes(copy), route);
    assert.ok(html.includes(`href="${entry}"`), route);
    assert.ok(sitemap.includes(`<loc>https://fishai.shop${route}</loc>`), route);
    assert.ok(!html.includes('"@type": "SoftwareApplication"'), route);
  }

  for (const route of [...pages.map(({ route }) => route), '/guides/ontario-fish-stocking-records']) {
    const index = rewrites.findIndex(({ source, destination }) => source === route && destination === `${route}.html`);
    assert.ok(index >= 0 && index < fallback, `${route} must route to prerendered HTML`);
  }
});
