# Hardened FishAI architecture

## Owner auth
`POST /api/auth/owner-verify` timing-safely checks `FISH_APP_SECRET`, then sets a short-lived encrypted HttpOnly cookie. The browser does not retain or replay the owner password.

## Subscriber auth
1. email starts Stripe Checkout;
2. Stripe redirects back with Checkout Session ID;
3. FishAI retrieves the session server-side;
4. FishAI verifies completion, FishAI metadata, customer, and active/trialing subscription;
5. FishAI sets a short-lived encrypted HttpOnly subscriber cookie.

Existing subscribers use a fixed-template email recovery link. Public recovery responses do not reveal whether an email is registered.

## Sessions
`FISH_SESSION_SECRET` is hashed into an AES-256-GCM key. Each token gets a fresh random IV and authenticated encryption. Claims contain role, subject, issue time, and expiry.

## AI quota protection
1. authenticated cookie first;
2. process-local abuse throttle;
3. client image compression and request-size bound;
4. MIME/base64 validation;
5. default two-provider maximum fallback;
6. default 12-second provider timeout;
7. output token cap;
8. schema/range normalization;
9. explicit failure instead of fabricated output.

## Production gating
The review branch is disabled in `vercel.json`. CI runs only on pull requests and does not deploy.
