# FishAI Agent Guide

## Non-negotiable rules

1. Never fabricate catches, spots, weather, ratings, measurements, regulations, field testing, reviews, or user data.
2. Unknown values remain unknown. Honest empty states beat believable fake defaults.
3. AI fish IDs and dimensions are estimates, never regulatory/harvest decisions.
4. Do not use Stripe customer IDs, email addresses, query strings, or browser-stored passwords as authorization.
5. Authentication stays in server-issued HttpOnly cookies.
6. Do not add arbitrary email-send endpoints.
7. Escape user-controlled strings passed to HTML APIs.
8. Privacy copy must say local-first, not “never leaves the device,” when network features send coordinates/photos.
9. Protect Hobby-plan resources: authenticate before provider calls, compress images client-side, bound retries/timeouts, avoid polling loops.
10. Production is `master`; agent work stays on review branches until explicitly merged.

## Required checks

```bash
npm ci
npm run check
```

This runs session tests, security/truthfulness regression checks, TypeScript, the production build, and static prerendering.

## Network boundaries

- weather coordinates -> Open-Meteo
- geocoding -> Nominatim
- map tiles -> CARTO/OpenStreetMap
- AI photo -> configured AI provider
- billing -> Stripe
- recovery -> Resend
