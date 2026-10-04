import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Truck, Printer, ShieldCheck } from 'lucide-react';
import {
  CATEGORY_LABELS,
  MERCH_PRODUCTS,
  formatCad,
  paymentLinkFor,
} from '../data/merch';

export function MerchProductPage() {
  const { productId = '' } = useParams();
  const product = MERCH_PRODUCTS.find((item) => item.id === productId);

  if (!product) {
    return <Navigate to="/" replace />;
  }

  const paymentLink = paymentLinkFor(product.id);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          FishAI home
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white text-slate-900 shadow-2xl grid lg:grid-cols-2">
          <div className="bg-slate-900 min-h-[360px]">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
              width="1200"
              height="1200"
            />
          </div>

          <section className="p-6 sm:p-9 lg:p-10">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">
              {CATEGORY_LABELS[product.category]} · FishAI lake-dawn line
            </div>
            <h1 className="mt-2 font-display text-3xl sm:text-5xl font-bold uppercase tracking-tight leading-none">
              {product.title}
            </h1>
            <div className="mt-4 text-2xl font-black text-amber-700">{formatCad(product.priceCad)}</div>

            <p className="mt-5 text-base leading-relaxed text-slate-600">{product.story}</p>

            <div className="mt-6">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Available sizes</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <span
                    key={size}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-sm font-bold text-slate-700"
                  >
                    {size}
                  </span>
                ))}
              </div>
              {product.sizeNote && <p className="mt-2 text-xs text-slate-500">{product.sizeNote}</p>}
            </div>

            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold uppercase tracking-wider text-lg shadow-lg transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              Buy securely · {formatCad(product.priceCad)}
            </a>

            <div className="mt-6 space-y-3 border-t border-slate-200 pt-5">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Printer className="w-4 h-4 text-teal-700" />
                Printed to order
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Truck className="w-4 h-4 text-teal-700" />
                Ships from Ontario, Canada
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                Secure payment through Stripe
              </div>
            </div>
          </section>
        </div>

        <nav className="mt-8 flex flex-wrap gap-3" aria-label="Related FishAI products">
          {MERCH_PRODUCTS.filter((item) => item.category === product.category && item.id !== product.id)
            .slice(0, 4)
            .map((item) => (
              <Link
                key={item.id}
                to={`/shop/${item.id}`}
                className="text-sm font-bold text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {item.title}
              </Link>
            ))}
        </nav>
      </div>
    </main>
  );
}
