import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

test('every sitemap page contains public content before JavaScript runs', async () => {
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
  assert.equal(urls.length, 40);
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
