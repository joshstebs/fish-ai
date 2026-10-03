import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import {
  CATEGORY_LABELS,
  MERCH_PRODUCTS,
  MerchCategory,
  MerchProduct,
  formatCad,
  isValidPaymentLink,
  paymentLinkFor,
} from '../data/merch';

type Filter = 'all' | MerchCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'tee', label: CATEGORY_LABELS.tee },
  { id: 'hoodie', label: CATEGORY_LABELS.hoodie },
  { id: 'hat', label: CATEGORY_LABELS.hat },
];

function ProductCard({ product, onOpen }: { product: MerchProduct; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group text-left bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-transform hover:-translate-y-1"
    >
      <div className="aspect-square overflow-hidden bg-slate-950">
        <img src={product.image} alt={product.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="p-4">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">{CATEGORY_LABELS[product.category]}</div>
        <div className="mt-1 font-display font-bold uppercase tracking-wide text-slate-900 leading-tight">{product.title}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-black text-amber-700">{formatCad(product.priceCad)}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Details →</span>
        </div>
      </div>
    </button>
  );
}

function ProductModal({ product, onClose }: { product: MerchProduct; onClose: () => void }) {
  const link = paymentLinkFor(product.id);
  const checkoutReady = isValidPaymentLink(link);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={product.title}
    >
      <div
        className="w-full sm:max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl grid md:grid-cols-2 max-h-[92vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-slate-950 min-h-[240px]">
          <img src={product.image} alt={product.title} className="w-full h-64 md:h-full object-cover" />
        </div>

        <div className="p-6 md:p-8 overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">{CATEGORY_LABELS[product.category]}</div>
              <h3 className="mt-1 font-display text-2xl font-bold uppercase tracking-wide text-slate-900 leading-none">{product.title}</h3>
            </div>
            <button onClick={onClose} aria-label="Close" className="shrink-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 text-2xl font-black text-amber-700">{formatCad(product.priceCad)}</div>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">{product.story}</p>

          <div className="mt-5">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Catalog sizes</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <span key={size} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                  {size}
                </span>
              ))}
            </div>
            {product.sizeNote && <div className="mt-2 text-xs text-slate-500">{product.sizeNote}</div>}
            <p className="mt-2 text-xs text-amber-700">
              Confirm the exact size or variant shown in Stripe checkout before paying. The website does not silently pass a local size selection to Stripe.
            </p>
          </div>

          {checkoutReady ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold uppercase tracking-wider text-lg transition-all"
            >
              <ShoppingBag className="w-5 h-5" /> Continue to Stripe <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Checkout is unavailable for this item because no verified Stripe payment link is configured.
            </div>
          )}

          <div className="mt-5 border-t border-slate-100 pt-4 flex items-start gap-2.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <span>Payment is hosted by Stripe. Review the product, variant, price, shipping, taxes, and checkout terms shown by Stripe before completing payment.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShopView() {
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<MerchProduct | null>(null);
  const visible = MERCH_PRODUCTS.filter((product) => filter === 'all' || product.category === filter);

  return (
    <div className="rounded-3xl overflow-hidden bg-gradient-to-b from-amber-50 via-white to-sky-50 border border-white/40">
      <div className="px-5 sm:px-10 pt-10 pb-6 text-center">
        <div className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-700">FishAI merch</div>
        <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-slate-900 leading-none">
          Current catalog<span className="text-teal-600">.</span>
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Product artwork, catalog prices, and Stripe-hosted checkout links currently configured in FishAI.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                filter === item.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 sm:px-10 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} onOpen={() => setSelected(product)} />
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
          Prices shown here are catalog values in CAD. Stripe checkout is the final source for transaction details.
        </p>
      </div>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
