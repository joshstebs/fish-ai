# FishAI hardened merge checklist

This branch is review-only and explicitly excluded from Vercel deployment.

Before merge:
- [ ] GitHub CI is green.
- [ ] Add a cryptographically random `FISH_SESSION_SECRET` (32+ characters) to the intended production Vercel project.
- [ ] Confirm `APP_URL=https://fishai.shop`.
- [ ] Confirm `FISH_APP_SECRET` is long, unique, and private.
- [ ] Confirm Stripe production keys, price, webhook, currency, monthly price, and trial behavior.
- [ ] Confirm Resend key and verified sender for subscriber recovery.
- [ ] Configure only AI providers you intentionally want to fund.
- [ ] Keep `VISION_MAX_PROVIDER_ATTEMPTS=2` initially.
- [ ] Verify each merch Stripe Payment Link collects the exact variant/size needed before charging.
- [ ] Review Privacy and Terms with the business owner / counsel as appropriate.
- [ ] Pick one canonical Vercel FishAI project before production to avoid duplicate builds.
- [ ] Merge only after explicit owner approval.

Post-merge smoke test:
1. New user has no fabricated catches, spots, tackle, photos, ratings, or measurements.
2. Owner login creates an HttpOnly cookie; password is absent from localStorage.
3. Checkout return exchanges Stripe session ID for an HttpOnly subscriber cookie.
4. Existing subscriber recovery is email-based and enumeration-resistant.
5. Portal access fails without a subscriber cookie.
6. AI rejects unauthenticated calls before provider invocation.
7. AI output contains no harvest legality verdict.
8. Photos without defensible scale can return no size estimate.
9. New spots require real entered values and default to private.
10. CSV export neutralizes formula-prefixed cells.
11. Privacy/Terms pages load.
