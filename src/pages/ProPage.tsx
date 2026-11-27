import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PRO_FEATURES, PRO_MONTHLY_PRICE, PRO_TRIAL_DAYS } from '../utils/proPlan';
import { LOGBOOK_ENTRY, PRO_ENTRY } from '../utils/publicEntry';

export function ProPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-black leading-tight text-white sm:text-6xl">FishAI Pro for catch photos</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-300">
          Use a catch photo to get a suggested species, an ID confidence score, and size estimates you can review before saving to your logbook.
        </p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-6" aria-labelledby="free-plan-heading">
          <h2 id="free-plan-heading" className="text-2xl font-bold text-white">Free</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
            <li>Manual catch logbook, filters and CSV export</li>
            <li>Personal catch insights and saved spots</li>
            <li>Weather and solunar planning tools</li>
          </ul>
          <a href={LOGBOOK_ENTRY} className="mt-5 inline-flex min-h-11 items-center font-bold text-emerald-300 underline underline-offset-4">Open free logbook</a>
        </section>
        <section className="rounded-2xl border border-emerald-400/30 bg-slate-900 p-5 sm:p-6" aria-labelledby="pro-plan-heading">
          <h2 id="pro-plan-heading" className="text-2xl font-bold text-white">Pro</h2>
          <p className="mt-3 font-bold text-white">{PRO_TRIAL_DAYS}-day free trial, then {PRO_MONTHLY_PRICE}/month</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
            {PRO_FEATURES.map(feature => <li key={feature}>{feature}</li>)}
          </ul>
          <a href={PRO_ENTRY} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-300">
            Continue to trial <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <p className="mt-3 text-sm text-slate-400">Review the billing currency and renewal terms in Stripe Checkout. Cancel anytime.</p>
        </section>
      </div>
      <p className="mt-6 text-sm leading-relaxed text-slate-400">Use a physical measuring tool and official regulations for harvest decisions. Fish identification and measurements from photos are estimates.</p>
    </article>
  );
}
