import React from 'react';
import { ShoppingBag, Truck, Printer, ShieldCheck } from 'lucide-react';
import { MERCH_PRODUCTS, CATEGORY_LABELS, paymentLinkFor, formatCad } from '../data/merch';

export function ProductLandingPage({ productId }: { productId: string }) {
  const product = MERCH_PRODUCTS.find((item) => item.id === productId);

  if (!product) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-black">Product not found</h1>
          <a href="/shop" className="mt-5 inline-block text-emerald-400 font-bold">Back to FishAI merch</a>
        </div>
      </main>
    );
  }

  const checkoutUrl = paymentLinkFor(product.id);
  const relatedProducts = MERCH_PRODUCTS
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto">
        <a href="/shop" className="text-sm font-bold text-emerald-400 hover:text-emerald-300">← FishAI merch</a>
        <div className="mt-5 overflow-hidden rounded-3xl bg-slate-900 text-white grid md:grid-cols-2 shadow-2xl">
          <div className="bg-slate-900">
            <img src={product.image} alt={product.title} className="w-full h-full min-h-[360px] object-cover" />
          </div>
          <div className="p-6 sm:p-9 flex flex-col">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">{CATEGORY_LABELS[product.category]}</div>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none">{product.title}</h1>
            <div className="mt-4 text-2xl font-black text-emerald-300">{formatCad(product.priceCad)}</div>
            <p className="mt-4 text-slate-300 leading-relaxed">{product.story}</p>

            <div className="mt-6">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Available sizes</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <span key={size} className="px-3 py-2 rounded-xl border border-slate-700 text-sm font-bold">{size}</span>
                ))}
              </div>
              {product.sizeNote && <div className="mt-2 text-xs text-slate-500">{product.sizeNote}</div>}
            </div>

            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 hover:bg-emerald-300 px-6 py-3.5 font-display font-black uppercase tracking-wider text-slate-950"
            >
              <ShoppingBag className="w-5 h-5" /> Buy now — {formatCad(product.priceCad)}
            </a>

            <div className="mt-6 space-y-2 border-t border-slate-700 pt-5">
              <div className="flex items-center gap-2 text-sm text-slate-500"><Printer className="w-4 h-4 text-emerald-400" /> Printed to order</div>
              <div className="flex items-center gap-2 text-sm text-slate-500"><Truck className="w-4 h-4 text-emerald-400" /> Ships from Ontario, Canada</div>
              <div className="flex items-center gap-2 text-sm text-slate-500"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure checkout via Stripe</div>
            </div>
          </div>
        </div>
        {relatedProducts.length > 0 && (
          <section aria-labelledby="related-designs-heading" className="mt-10">
            <h2 id="related-designs-heading" className="font-display text-2xl font-black uppercase tracking-wide">
              More {CATEGORY_LABELS[product.category].toLowerCase()} designs
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {relatedProducts.map((related) => (
                <li key={related.id}>
                  <a href={`/shop/${related.id}`} className="block rounded-xl border border-slate-700 bg-slate-900 p-4 hover:border-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400">
                    <span className="block font-bold">{related.title}</span>
                    <span className="mt-1 block text-sm text-slate-300">{formatCad(related.priceCad)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

