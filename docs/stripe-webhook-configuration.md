# Stripe webhook signing configuration

The billing webhook is `/api/billing/webhook`. It verifies the exact request
bytes, logs the authenticated event type and ID, and acknowledges the event.
Subscription entitlement remains a direct lookup using `STRIPE_SECRET_KEY`.

- `STRIPE_WEBHOOK_SECRET`: existing primary destination signing secret.
- `STRIPE_SANDBOX_WEBHOOK_SECRET`: optional signing secret from a separate
  Stripe sandbox destination. Only events with `livemode: false` can use it.

A sandbox's signing secret is separate from its API key, and from every other
destination's signing secret. Configure each value as a server-side secret in
the deployment environment that receives the webhook, then redeploy. Never put
these values in source control or public frontend variables.

Adding a sandbox signing secret does not change the billing API key, price,
Checkout behavior, or customer entitlement. Test-mode subscription checks need
a separate test deployment with a matching sandbox API key and price.

Run `node --import tsx scripts/verify-billing-webhook.ts` for offline signature
and billing contract checks. The Stripe SDK verifies real HMAC signatures, but
external Stripe customer, subscription, Checkout, and portal calls are stubbed.
After deployment, resend existing failed events from the Stripe Dashboard and
verify HTTP 200 plus matching event IDs in the Vercel runtime logs.
