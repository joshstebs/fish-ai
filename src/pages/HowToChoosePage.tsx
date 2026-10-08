import React from 'react';

export function HowToChoosePage({ onStart }: { onStart?: () => void } = {}) {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-slate-300 leading-relaxed">
      <p className="text-xs uppercase tracking-widest text-emerald-400">Fishing app decision worksheet | Updated October 8, 2026</p>
      <h1 className="mt-3 text-3xl sm:text-4xl font-display font-black text-white">How to choose a fishing app for your actual trips</h1>
      <p className="mt-4">Start with the task you need help with, then test that task on a waterbody you know. A long feature list does not establish local coverage, accuracy or useful access information.</p>
      <p className="mt-3 text-sm">Disclosure: FishAI publishes this guide. This worksheet is not an independent ranking or a controlled test. Compare competing tools using the same tasks before subscribing.</p>
      <section className="mt-7 bg-slate-900 rounded-xl p-5">
        <h2 className="text-white text-xl font-bold">Match the tool to the question</h2>
        <ul className="mt-3 space-y-3 list-disc pl-5">
          <li><strong>Where can I research Ontario waters?</strong> Start with official lake and access records. A mapped point still needs a current access and regulation check. <a className="text-emerald-300 underline" href="/guides/best-fishing-app-ontario">Search Ontario data</a>.</li>
          <li><strong>Where have other anglers caught fish?</strong> Compare community reports, their dates and available map layers. A historical catch is not a promise about your next trip.</li>
          <li><strong>How do I remember my own catches?</strong> Compare logging fields, location privacy and whether you can recover records after changing devices.</li>
          <li><strong>What conditions should I plan around?</strong> Check the location, timestamp and forecast horizon. A bite score is a prediction, not a measured catch probability.</li>
          <li><strong>What species might this be?</strong> Compare a clear photo with a known species. Verify the identification independently before using it for any retention decision.</li>
        </ul>
      </section>
      <section className="mt-7">
        <h2 className="text-white text-xl font-bold">Use the same trial for every app</h2>
        <p className="mt-3">Choose one familiar waterbody and record its exact name and coordinates. Set the same location in each app. Note which information is available on the free plan, which requires payment and which is missing.</p>
        <p className="mt-3">Create a harmless test catch without exposing a real private spot. Check the audience and location settings, then edit and delete the record. Try saving a record, closing the app and reopening it. Before relying on offline use, repeat your needed tasks with connectivity disabled.</p>
        <p className="mt-3">If export or account recovery matters, try it during the trial. A file download is only useful if it preserves the dates, species and notes you need and can be opened elsewhere.</p>
      </section>
      <section className="mt-7 bg-slate-900 rounded-xl p-5">
        <h2 className="text-white text-xl font-bold">Copy this comparison sheet</h2>
        <p className="mt-3">For each app, record: task tested; waterbody; device; test date; free or paid tier; result; missing data; privacy setting; export or recovery result; subscription price and currency; renewal terms.</p>
        <p className="mt-3">Use three evidence labels: passed my trial, described by the provider, or not verified. Leave a feature unknown when you cannot test it. Decide which missing features actually prevent your planned trip rather than adding up checkmarks.</p>
      </section>
      <section className="mt-7">
        <h2 className="text-white text-xl font-bold">When two tools make more sense than one</h2>
        <p className="mt-3">Official information and personal trip tools serve different purposes. You can use Ontario resources for waterbody research and current rules, alongside a fishing app for records or conditions. Re-check seasonal closures, property permissions and launch status before leaving.</p>
        <p className="mt-3">Compare <a className="text-emerald-300 underline" href="/fishai-vs-fishbrain">FishAI and Fishbrain</a> or <a className="text-emerald-300 underline" href="/fishai-vs-fishangler">FishAI and FishAngler</a>, then try <a className="text-emerald-300 underline" href="/">FishAI</a> with your own checklist.</p>
        <p className="mt-4 text-sm">Official reference: <a className="text-emerald-300 underline" href="https://www.ontario.ca/document/ontario-fishing-regulations-summary">Ontario fishing regulations summary</a>. This guide does not establish legal access or replace current official rules.</p>
      </section>
    </article>
  );
}
