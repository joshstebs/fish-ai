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

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto">
        <a href="/shop" className="text-sm font-bold text-emerald-400 hover:text-emerald-300">← FishAI merch</a>
        <div className="mt-5 overflow-hidden rounded-3xl bg-white text-slate-900 grid md:grid-cols-2 shadow-2xl">
          <div className="bg-slate-900">
            <img src={product.image} alt={product.title} className="w-full h-full min-h-[360px] object-cover" />
          </div>
          <div className="p-6 sm:p-9 flex flex-col">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-700">{CATEGORY_LABELS[product.category]}</div>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none">{product.title}</h1>
            <div className="mt-4 text-2xl font-black text-amber-700">{formatCad(product.priceCad)}</div>
            <p className="mt-4 text-slate-600 leading-relaxed">{product.story}</p>

            <div className="mt-6">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Available sizes</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <span key={size} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold">{size}</span>
                ))}
              </div>
              {product.sizeNote && <div className="mt-2 text-xs text-slate-500">{product.sizeNote}</div>}
            </div>

            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 px-6 py-3.5 font-display font-black uppercase tracking-wider text-slate-950"
            >
              <ShoppingBag className="w-5 h-5" /> Buy now — {formatCad(product.priceCad)}
            </a>

            <div className="mt-6 space-y-2 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2 text-sm text-slate-500"><Printer className="w-4 h-4 text-teal-700" /> Printed to order</div>
              <div className="flex items-center gap-2 text-sm text-slate-500"><Truck className="w-4 h-4 text-teal-700" /> Ships from Ontario, Canada</div>
              <div className="flex items-center gap-2 text-sm text-slate-500"><ShieldCheck className="w-4 h-4 text-teal-700" /> Secure checkout via Stripe</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
