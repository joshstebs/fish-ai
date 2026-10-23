import assert from 'node:assert/strict';
import { once } from 'node:events';
import Stripe from 'stripe';

// Offline integration diagnostic: synthetic keys, no Stripe network calls.
process.env.STRIPE_SECRET_KEY = 'sk_test_offline_diagnostic';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_offline_diagnostic';
process.env.STRIPE_PRICE_ID = 'price_offline_diagnostic';
process.env.APP_URL = 'https://fishai.example';
process.env.FISH_APP_SECRET = 'offline_diagnostic';
const { default: app } = await import('../api/index.js');
const { billingStripe } = await import('../server/routes/billingRoutes.js');
assert.ok(billingStripe);
const stripe = billingStripe!;
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
assert.ok(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}`;
const results: { check: string; status: string }[] = [];
const record = (check: string) => results.push({ check, status: 'PASS' });
const payload = JSON.stringify({ id: 'evt_offline_diagnostic', object: 'event',
  type: 'checkout.session.completed', livemode: false,
  data: { object: { id: 'cs_test_offline', payment_status: 'paid' } } }, null, 2);
const sign = (body: string, secret = process.env.STRIPE_WEBHOOK_SECRET!, timestamp?: number) =>
  Stripe.webhooks.generateTestHeaderString({ payload: body, secret, timestamp });
async function webhook(body: string, signature?: string) {
  return fetch(`${base}/api/billing/webhook`, { method: 'POST',
    headers: { 'content-type': 'application/json', ...(signature ? { 'stripe-signature': signature } : {}) }, body });
}

try {
  let response = await webhook(payload, sign(payload));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { received: true });
  record('Valid signed, formatted JSON reaches exported Vercel app locally and returns 200');
  response = await webhook(payload, sign(payload));
  assert.equal(response.status, 200);
  record('Repeated valid event is acknowledged without duplicate side effects');
  for (const [name, body, signature] of [
    ['unsigned', payload, undefined],
    ['wrong signing secret', payload, sign(payload, 'whsec_wrong')],
    ['mutated body', payload + ' ', sign(payload)],
    ['expired timestamp', payload, sign(payload, undefined, 1)],
  ] as const) {
    response = await webhook(body, signature);
    assert.equal(response.status, 400, name);
    record(`Rejects ${name} request with 400`);
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  response = await webhook(payload, sign(payload, secret));
  assert.equal(response.status, 501);
  record('Missing signing secret fails closed with 501');
  process.env.STRIPE_WEBHOOK_SECRET = secret;

  process.env.STRIPE_SANDBOX_WEBHOOK_SECRET = 'whsec_separate_sandbox_diagnostic';
  response = await webhook(payload, sign(payload, process.env.STRIPE_SANDBOX_WEBHOOK_SECRET));
  assert.equal(response.status, 200);
  record('Separate sandbox signing secret authenticates test events');
  response = await webhook(payload, sign(payload));
  assert.equal(response.status, 200);
  record('Primary signing secret remains valid with sandbox configuration present');
  const livePayload = JSON.stringify({ ...JSON.parse(payload), livemode: true });
  response = await webhook(livePayload, sign(livePayload, process.env.STRIPE_SANDBOX_WEBHOOK_SECRET));
  assert.equal(response.status, 400);
  record('Sandbox signing secret cannot authenticate live events');
  response = await webhook(payload, sign(payload, 'whsec_wrong'));
  assert.equal(response.status, 400);
  record('Invalid signature is rejected with both secrets configured');
  delete process.env.STRIPE_WEBHOOK_SECRET;
  response = await webhook(payload, sign(payload, process.env.STRIPE_SANDBOX_WEBHOOK_SECRET));
  assert.equal(response.status, 200);
  record('Sandbox-only signing configuration accepts sandbox events');
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  delete process.env.STRIPE_SANDBOX_WEBHOOK_SECRET;

  // Replace every external method exercised below; these are contract checks,
  // not proof of actual Stripe Checkout or subscription fulfillment.
  let subscriptions: any[] = [];
  (stripe.customers.list as any) = async ({ email }: any) => {
    assert.equal(email, 'billing-test@example.com');
    return { data: [{ id: 'cus_offline' }] };
  };
  (stripe.subscriptions.list as any) = async ({ customer }: any) => {
    assert.equal(customer, 'cus_offline');
    return { data: subscriptions };
  };
  (stripe.checkout.sessions.create as any) = async (params: any) => {
    assert.equal(params.mode, 'subscription');
    assert.equal(params.customer, 'cus_offline');
    assert.equal(params.line_items[0].price, 'price_offline_diagnostic');
    assert.equal(params.subscription_data.trial_period_days, 7);
    assert.equal(params.success_url, 'https://fishai.example/?checkout=success');
    return { id: 'cs_test_offline', url: 'https://checkout.stripe.com/offline' };
  };
  (stripe.billingPortal.sessions.create as any) = async (params: any) => {
    assert.equal(params.customer, 'cus_offline');
    return { url: 'https://billing.stripe.com/offline' };
  };
  const checkout = () => fetch(`${base}/api/billing/checkout`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'Billing-Test@example.com' }) });
  response = await checkout();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).customerId, 'cus_offline');
  record('Checkout contract creates seven-day trial with configured recurring price');
  for (const [status, entitled] of [['trialing', true], ['active', true], ['canceled', false], ['past_due', false]] as const) {
    subscriptions = [{ id: 'sub_offline', status, trial_end: 1234 }];
    response = await fetch(`${base}/api/billing/status?customer_id=cus_offline`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).entitled, entitled);
    record(`Status reads Stripe subscription ${status} as entitled=${entitled}`);
  }
  subscriptions = [{ status: 'active' }];
  response = await checkout();
  assert.equal((await response.json()).alreadyEntitled, true);
  record('Existing entitled customer goes to portal instead of a duplicate checkout');
  console.log(JSON.stringify({ environment: 'offline; Stripe API methods stubbed', results }, null, 2));
} finally {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
