import React from 'react';
import { ArrowRight, BookOpen, Download, Lock } from 'lucide-react';
import { LOGBOOK_ENTRY } from '../utils/publicEntry';

export function FishingLogbookPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-black leading-tight text-white sm:text-6xl">A private fishing logbook</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-300">
          Record your catches, keep track of what you used, and see what worked on past trips. FishAI’s manual logbook is free and opens in your browser without an account.
        </p>
        <a href={LOGBOOK_ENTRY} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-300">
          Open free logbook <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </div>

      <section className="mt-10" aria-labelledby="catch-entry-heading">
        <h2 id="catch-entry-heading" className="text-2xl font-bold text-white">What to record after a catch</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <BookOpen className="size-5 text-emerald-400" aria-hidden="true" />
            <h3 className="mt-3 font-bold text-white">Fish and tackle</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">Start with the species. Add the lure, technique, length and weight if you know them.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <Lock className="size-5 text-emerald-400" aria-hidden="true" />
            <h3 className="mt-3 font-bold text-white">Water and conditions</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">Use a location label you recognize, and add notes on clarity or weather. Catch entries are saved in this browser.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <Download className="size-5 text-emerald-400" aria-hidden="true" />
            <h3 className="mt-3 font-bold text-white">A record you can export</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">Filter your log by species or search for a lure or location. Download a CSV copy before clearing your browser data.</p>
          </div>
        </div>
      </section>

      <section className="mt-10 border-t border-white/10 pt-6">
        <h2 className="text-2xl font-bold text-white">Start with your next catch</h2>
        <p className="mt-3 max-w-2xl text-slate-300">Open the Logbook and select Quick Log. After several trips, open Insights to compare your logged catches by species, time or lure.</p>
        <p className="mt-3 text-slate-300">Working from a photo? <a href="/pro" className="text-emerald-300 underline underline-offset-4">Explore FishAI Pro’s photo analysis</a>.</p>
      </section>
    </article>
  );
}
