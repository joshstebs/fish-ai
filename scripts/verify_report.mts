// Temp verification script — runs the real buildFishReport adapter against
// live Open-Meteo + real solunar math. Deleted before commit.
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (_i: number) => null,
  length: 0,
};
(globalThis as any).navigator = {};

const { buildFishReport } = await import('../src/utils/fishReportData');

const report = await buildFishReport({
  location: { label: 'Lake Hartwell', latitude: 34.5491573, longitude: -83.1134681 },
  species: 'largemouth',
  tackle: ['spinnerbait', 'topwater', 'softplastic', 'squarebill', 'jig', 'dropshot'],
});

console.log('location:', report.location.label);
console.log('localTime:', report.localTime, '| timeZone:', report.timeZone);
console.log('current:', JSON.stringify(report.current));
console.log('confidence:', report.confidence.score, report.confidence.label, '|', report.confidence.summary);
console.log('factors:', report.confidence.factors.map((f) => `${f.label}:${f.detail}`).join(' | '));
console.log('pressure:', report.pressure.inHg, 'inHg trend', report.pressure.trend, 'delta', report.pressure.deltaMb, 'mb, series len', report.pressure.series.length);
console.log('biteWindow:', 'major', report.biteWindow.major, 'minor', report.biteWindow.minor, '| hours', report.biteWindow.hours.length, 'peaks', report.biteWindow.hours.filter((h) => h.isPeak).map((h) => h.label).join(','));
console.log('recommendation:', report.recommendation.lure, report.recommendation.color, `${report.recommendation.match}%`);
console.log('  why:', report.recommendation.why);
console.log('  backups:', report.recommendation.alternates.map((a) => a.lure).join(', '));
