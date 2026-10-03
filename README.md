# FishAI - Personal Fishing Intelligence

FishAI is a local-first fishing web application for planning trips, logging real catches, inspecting conditions, saving spots, learning from personal history, and optionally analyzing user-supplied fish photos with AI.

## Current product

| Area | Behavior |
|---|---|
| Fish Report | Live Open-Meteo weather + computed solunar timing + the user's own stored history |
| Vision | User upload only. Species hypothesis, confidence, caveated visual size/weight estimates when supportable, tackle suggestions |
| Logbook | Local browser catch storage, search/filter, CSV export |
| Insights | Derived only from catches the user actually stored |
| Spot Map | Local-first spot records using a real map pin or browser GPS |
| Solunar | Astronomy-derived calculations for selected coordinates/date |
| Pressure | Live Open-Meteo pressure/trend |
| Tackle Box | Local persisted gear inventory, empty for new users |
| Billing | Stripe Checkout + short-lived encrypted HttpOnly subscriber session |
| Recovery | Fixed-template Resend email for active subscribers |
| Shop | Catalog + Stripe-hosted payment links |

## Truthfulness rules

- No fabricated catches, spots, tackle, ratings, weather, measurements, field testing, reviews, or legal decisions.
- New users begin with empty personal data.
- Network failures surface as failures rather than believable fake data.
- AI fish identification and size/weight are estimates.
- FishAI does not determine harvest legality. Users must verify current official regulations.
- Local-first does not mean network-free. Weather/geocoding/map/AI/billing features send relevant inputs to their service providers.

## Security

See [SECURITY.md](./SECURITY.md) and [docs/SECURITY_ARCHITECTURE.md](./docs/SECURITY_ARCHITECTURE.md).

Key points:
- owner password is never stored in localStorage;
- Stripe customer IDs are never credentials;
- owner/subscriber auth uses encrypted HttpOnly cookies;
- AI calls require authenticated sessions before provider invocation;
- provider fallback is bounded for Hobby-plan cost control;
- there is no arbitrary public email relay;
- Stripe webhook signatures are verified;
- Leaflet popup strings and exported CSV cells are hardened against injection.

## Local development

```bash
npm ci
cp .env.example .env
npm run dev:all
```

Run all checks:

```bash
npm run check
```

## Production handoff

Do not merge the hardening branch until [docs/MERGE_CHECKLIST.md](./docs/MERGE_CHECKLIST.md) is complete. The review branch is intentionally excluded from Vercel deployment.
