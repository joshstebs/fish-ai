import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';

// Exercise the real Express app without external Stripe or Resend credentials.
// Protected endpoints must fail before reaching a billable provider.
delete process.env.STRIPE_SECRET_KEY;
delete process.env.RESEND_API_KEY;
process.env.FISH_SESSION_SECRET = 'test-only-long-session-signing-key-not-for-production';
process.env.FISH_APP_SECRET = 'test-only-owner-password';

const { app } = await import('./app.js');

async function withServer(fn: (base: string) => Promise<void>): Promise<void> {
  const listener = app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const address = listener.address();
  if (!address || typeof address === 'string') throw new Error('Expected TCP listener');
  try {
    await fn(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => listener.close(err => err ? reject(err) : resolve()));
  }
}

test('a caller-supplied customer ID cannot query private subscription status', async () => {
  await withServer(async base => {
    const response = await fetch(base + '/api/billing/status?customer_id=cus_someone_else');
    assert.equal(response.status, 401);
    assert.equal((await response.json()).code, 'SESSION_REQUIRED');
  });
});

test('a caller-supplied customer ID cannot open someone else’s portal', async () => {
  await withServer(async base => {
    const response = await fetch(base + '/api/billing/portal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: 'cus_someone_else' }),
    });
    // Without Stripe keys this must fail closed; the route cannot use the ID.
    assert.ok([401, 503].includes(response.status));
  });
});

test('client-provided subscriber headers never authorize AI access', async () => {
  await withServer(async base => {
    const response = await fetch(base + '/api/ai/analyze-fish', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-fish-customer-id': 'cus_someone_else' },
      body: JSON.stringify({ imageBase64: 'data:image/png;base64,AA==' }),
    });
    assert.equal(response.status, 401);
  });
});

test('email-test endpoint cannot send arbitrary mail even with a payload', async () => {
  await withServer(async base => {
    const response = await fetch(base + '/api/mail/test', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: 'third-party@example.net', html: '<b>unsolicited</b>' }),
    });
    assert.equal(response.status, 410);
    assert.equal((await response.json()).code, 'MAIL_TEST_DISABLED');
  });
});

test('cross-origin write attempts are refused', async () => {
  await withServer(async base => {
    const response = await fetch(base + '/api/billing/portal', {
      method: 'POST', headers: { Origin: 'https://attacker.example.net' },
    });
    assert.equal(response.status, 403);
  });
});

test('operations flags require a distinct bearer token and expose no secrets', async () => {
  const token = 'fixture-operations-token-not-for-production';
  process.env.FISH_OPERATIONS_TOKEN = token;
  process.env.GEMINI_API_KEY = 'fixture-provider-key-must-stay-server-side';
  try {
    await withServer(async base => {
      assert.equal((await fetch(base + '/api/operations')).status, 401);
      assert.equal((await fetch(base + '/api/operations', {
        headers: { Authorization: 'Bearer ' + process.env.FISH_APP_SECRET },
      })).status, 401);
      const response = await fetch(base + '/api/operations', { headers: { Authorization: 'Bearer ' + token } });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), { geminiConfigured: true, modules: {} });
    });
  } finally {
    delete process.env.FISH_OPERATIONS_TOKEN;
    delete process.env.GEMINI_API_KEY;
  }
});
