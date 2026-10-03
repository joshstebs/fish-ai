# FishAI Security

Last reviewed: 2026-10-03

## Security model

- Owner password is exchanged for a short-lived encrypted HttpOnly cookie and is never stored in browser storage.
- Paid-user access is established only after server-side verification of a completed Stripe Checkout session or a short-lived recovery token.
- Stripe customer IDs and email addresses are identifiers, never authorization credentials.
- Session payloads use AES-256-GCM with a server-only `FISH_SESSION_SECRET`.
- AI, Stripe, Resend, and session secrets stay server-side.
- AI endpoints require an authenticated owner/subscriber cookie before any provider call.
- AI provider retries are bounded to protect quota and Vercel execution time.
- Stripe portal access requires a subscriber cookie and a live entitlement check.
- Recovery email is fixed-template and enumeration-resistant. There is no arbitrary email relay.
- Stripe webhook signatures are verified over the raw request body.
- User-controlled Leaflet popup strings are escaped.
- CSV exports defend against spreadsheet-formula injection.

## Data and privacy

Fishing profile, catches, saved spots, tackle, and small catch-photo thumbnails are local-first browser data.

Network features still send the data they require:
- Open-Meteo: requested coordinates for weather
- Nominatim: place queries / coordinates for geocoding
- CARTO/OpenStreetMap infrastructure: map tile requests
- configured AI provider: the photo explicitly submitted for analysis
- Stripe: checkout and billing
- Resend: account-recovery email
- Vercel: normal hosting/API request metadata

## Known limit

The lightweight rate limiter is process-local. On serverless infrastructure it is defense-in-depth, not a globally consistent quota store. Cost protection therefore starts with authenticated sessions, small request limits, bounded provider retries, and short timeouts.
