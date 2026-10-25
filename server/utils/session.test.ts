import assert from 'node:assert/strict';
import test from 'node:test';
import { issueSession, sessionConfigured, verifySession } from './session.js';

process.env.FISH_SESSION_SECRET = 'test-only-secret-that-is-definitely-longer-than-thirty-two-characters';

test('session encryption round-trips valid claims', () => {
  assert.equal(sessionConfigured(), true);
  const token = issueSession('subscriber', 'cus_test_subject', 300);
  const claims = verifySession(token, ['subscriber']);
  assert.ok(claims);
  assert.equal(claims.kind, 'subscriber');
  assert.equal(claims.sub, 'cus_test_subject');
});

test('tampered session tokens are rejected', () => {
  const token = issueSession('owner', 'owner', 300);
  const parts = token.split('.');
  const ciphertext = Buffer.from(parts[2], 'base64url');
  ciphertext[0] ^= 0x01;
  parts[2] = ciphertext.toString('base64url');
  assert.equal(verifySession(parts.join('.'), ['owner']), null);
});

test('session kind restrictions are enforced', () => {
  const token = issueSession('subscriber', 'cus_test_subject', 300);
  assert.equal(verifySession(token, ['owner']), null);
});
