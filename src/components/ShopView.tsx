import React, { useState } from 'react';
import { X, ShoppingBag, Truck, Printer, ShieldCheck } from 'lucide-react';
import {
  MERCH_PRODUCTS,
  CATEGORY_LABELS,
  MerchCategory,
  MerchProduct,
  paymentLinkFor,
  isPlaceholderLink,
  formatCad,
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
    <a
      href={`/shop/${product.id}`}
      onClick={(event) => { event.preventDefault(); onOpen(); }}
      className="group block text-left bg-white rounded-2xl border border-slate-200/80 shadow-[0_18px_50px_-24px_rgba(15,42,51,0.35)] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_28px_60px_-24px_rgba(15,42,51,0.45)]"
    >
      <div className="aspect-square overflow-hidden bg-slate-950">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-4">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">{CATEGORY_LABELS[product.category]}</div>
        <div className="mt-1 font-display font-bold uppercase tracking-wide text-slate-900 leading-tight">{product.title}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-black text-amber-700">{formatCad(product.priceCad)}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-teal-700 transition-colors">View →</span>
        </div>
      </div>
    </a>
  );
}

function ProductModal({ product, onClose }: { product: MerchProduct; onClose: () => void }) {
  const [size, setSize] = useState(product.category === 'hat' ? 'One size' : 'M');
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqSent, setReqSent] = useState(false);
  const link = paymentLinkFor(product.id);
  const placeholder = isPlaceholderLink(link);

  const sendRequest = () => {
    const subject = encodeURIComponent('FishAI merch order request');
    const body = encodeURIComponent(
      `Hi Josh,\n\nI'd like to order:\n\nProduct: ${product.title}\nGarment: ${CATEGORY_LABELS[product.category]}\nSize: ${size}\nPrice: ${formatCad(product.priceCad)} CAD\n\nMy name: ${reqName}\nMy email: ${reqEmail}\n\nThanks!`
    );
    window.location.href = `mailto:josh@fishai.shop?subject=${subject}&body=${body}`;
    setReqSent(true);
  };

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
        onClick={(e) => e.stopPropagation()}
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
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-700">{formatCad(product.priceCad)}</div>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">{product.story}</p>

          <div className="mt-5">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Size</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    size === s
                      ? 'bg-slate-900 text-white border-slate-900 shadow'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-900'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {product.sizeNote && <div className="mt-1.5 text-xs text-slate-500">{product.sizeNote}</div>}
          </div>

          {!placeholder ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold uppercase tracking-wider text-lg shadow-[0_16px_40px_-12px_rgba(245,158,11,0.7)] transition-all"
            >
              <ShoppingBag className="w-5 h-5" /> Buy now — {formatCad(product.priceCad)}
            </a>
          ) : !reqSent ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">Request this item</div>
              <p className="mt-1 text-xs text-slate-500">Online checkout is being wired up — send a request and Josh will confirm your order by email.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  placeholder="Your name"
                  className="col-span-1 px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600"
                />
                <input
                  value={reqEmail}
                  onChange={(e) => setReqEmail(e.target.value)}
                  placeholder="Email"
                  type="email"
                  className="col-span-1 px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600"
                />
              </div>
              <button
                onClick={sendRequest}
                disabled={!reqName.trim() || !reqEmail.trim()}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-display font-bold uppercase tracking-wider transition-all"
              >
                <ShoppingBag className="w-5 h-5" /> Send order request
              </button>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-center">
              <div className="text-sm font-bold text-teal-800">Request sent!</div>
              <p className="mt-1 text-xs text-teal-700">Your email app should have opened with the order details. Josh will confirm by email.</p>
            </div>
          )}

          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
            {[
              { icon: Printer, text: 'Printed to order — made just for you' },
              { icon: Truck, text: 'Ships from Ontario, Canada' },
              { icon: ShieldCheck, text: 'Secure checkout via Stripe' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-xs text-slate-500">
                <Icon className="w-4 h-4 text-teal-700 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShopView() {
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<MerchProduct | null>(null);

  const visible = MERCH_PRODUCTS.filter((p) => filter === 'all' || p.category === filter);

  return (
    <div className="rounded-3xl overflow-hidden bg-gradient-to-b from-amber-50 via-white to-sky-50 border border-white/40 shadow-[0_30px_80px_-40px_rgba(15,42,51,0.5)]">
      {/* Store header */}
      <div className="px-5 sm:px-10 pt-10 pb-6 text-center">
        <div className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-700">FishAI merch</div>
        <h2 className="mt-2 font-display text-4xl sm:text-5xl font-bold uppercase tracking-tight text-slate-900 leading-none">
          Wear the water<span className="text-teal-600">.</span>
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Original FishAI designs from the lake-dawn line. Printed to order and shipped from Ontario — no warehouse, no waste.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                filter === f.id
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-5 sm:px-10 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={() => setSelected(p)} />
          ))}
        </div>
        {visible.length === 0 && (
          <div className="py-16 text-center text-sm text-slate-500">Nothing here yet — check back soon.</div>
        )}
        <div className="mt-10 text-center text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
          Every piece is printed to order in small batches. Prices in Canadian dollars, taxes calculated at checkout.
        </div>
      </div>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
