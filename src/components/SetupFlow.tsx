import { useState } from 'react';
import { Crosshair, Loader2, MapPin, Search } from 'lucide-react';
import { reverseGeocode, searchPlaces, PlaceResult } from '../utils/geocode';
import {
  DEFAULT_TACKLE,
  LURES,
  SPECIES,
  GeoLocation,
  LureId,
  SpeciesId,
} from '../utils/fishing';

const STEPS = ['Home water', 'Target species', 'Tackle box'] as const;

export function SetupFlow({
  initial,
  onComplete,
  onCancel,
}: {
  initial: { location: GeoLocation | null; species: SpeciesId; tackle: LureId[] };
  onComplete: (p: { location: GeoLocation; species: SpeciesId; tackle: LureId[] }) => void;
  onCancel?: (() => void) | undefined;
}) {
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState<GeoLocation | null>(initial.location);
  const [species, setSpecies] = useState<SpeciesId>(initial.species);
  const [tackle, setTackle] = useState<LureId[]>(initial.tackle.length ? initial.tackle : DEFAULT_TACKLE);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [busy, setBusy] = useState<'search' | 'gps' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setBusy('search');
    setError(null);
    try {
      const found = await searchPlaces(query.trim());
      setResults(found);
      if (!found.length) setError('No water found by that name. Try a lake, river or nearby town.');
    } catch {
      setError("Couldn't search right now. Try again in a moment.");
    } finally {
      setBusy(null);
    }
  }

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setError("This device can't share a location. Search for your water instead.");
      return;
    }
    setBusy('gps');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const label = await reverseGeocode(latitude, longitude);
          setLocation({ label, latitude, longitude });
        } catch {
          setLocation({ label: 'Current position', latitude, longitude });
        } finally {
          setBusy(null);
        }
      },
      () => {
        setBusy(null);
        setError('Location permission denied. Search for your water instead.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const toggleLure = (id: LureId) =>
    setTackle((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]));

  const canContinue = step === 0 ? Boolean(location) : step === 2 ? tackle.length > 0 : true;

  return (
    <div
      className="setup-panel w-full rounded-2xl border border-border bg-card p-6 sm:p-8"
      style={{ boxShadow: 'var(--shadow-panel)' }}
    >
      {/* Step rail */}
      <ol className="flex items-center gap-3">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-3">
            <div className="flex-1" aria-current={i === step ? 'step' : undefined}>
              <div className={`h-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-secondary'}`} aria-hidden="true" />
              <div
                className={`mt-2 text-[10px] uppercase tracking-widest ${
                  i === step ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {s}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="mt-7">
          <h2 className="headline text-3xl">Where are you fishing?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            FishAI pulls live weather, pressure history and solunar timing for this exact water.
          </p>

          <button
            type="button"
            onClick={useMyLocation}
            disabled={busy === 'gps'}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy === 'gps' ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
            Use my current location
          </button>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or search <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={runSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Lake Erie, Detroit River, Windsor…"
                aria-label="Search for a lake, river or town"
                className="w-full rounded-lg border border-border bg-background py-3 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={busy === 'search'}
              className="rounded-lg border border-border px-4 text-sm font-semibold uppercase tracking-widest transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
            >
              {busy === 'search' ? <Loader2 className="size-4 animate-spin" /> : 'Find'}
            </button>
          </form>

          {results.length > 0 && (
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setLocation({ label: r.name, latitude: r.latitude, longitude: r.longitude })}
                    className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-secondary"
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      <span className="block text-sm font-medium">{r.name}</span>
                      <span className="block text-xs text-muted-foreground">{r.address}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {location && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
              <MapPin className="size-4 text-primary" />
              <span className="font-medium">{location.label}</span>
              <span className="text-xs text-muted-foreground">
                {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}
              </span>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="mt-7">
          <h2 className="headline text-3xl">What are you after?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Species sets the temperature bands and lure families FishAI scores against.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {SPECIES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSpecies(s.id)}
                className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                  species === s.id
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="font-medium">{s.name}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">Peaks near {s.tempIdeal}°F</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-7">
          <h2 className="headline text-3xl">What's in your box?</h2>
          <p className="mt-2 text-sm text-muted-foreground">FishAI only recommends baits you actually carry. Tap to toggle.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {LURES.map((l) => (
              <button
                key={l.id}
                type="button"
                aria-pressed={tackle.includes(l.id)}
                onClick={() => toggleLure(l.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  tackle.includes(l.id)
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setTackle(DEFAULT_TACKLE)}
            className="mt-4 text-xs uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Select all
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => (step === 0 ? onCancel?.() : setStep(step - 1))}
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          disabled={step === 0 && !onCancel}
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        <button
          type="button"
          disabled={!canContinue}
          onClick={() => {
            if (step < 2) return setStep(step + 1);
            if (location) onComplete({ location, species, tackle });
          }}
          className="rounded-lg bg-primary px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {step === 2 ? 'Build my report' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

