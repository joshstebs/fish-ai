import express from 'express';
import ontarioDataHandler from '../api/ontario-data.js';
import cors from 'cors';
import crypto from 'crypto';
import { aiRouter } from './routes/aiRoutes.js';
import { billingRouter, billingStripe, customerIsEntitled } from './routes/billingRoutes.js';
import { mailRouter } from './routes/mailRoutes.js';
import { rateLimit, rateLimitHeaders } from './utils/rateLimit.js';
// Shared Express app, used by:
//  - server/server.ts (local dev: app.listen)
//  - api/index.ts (Vercel: exported as a serverless function)
export const app = express();

app.use(cors());
// Client-side image compression (FishDimensionEstimator) keeps payloads well
// under 1MB; 15mb is generous headroom (Vercel caps requests at 4.5MB anyway).
// The verify hook stashes the raw body (needed for Stripe webhook signature
// verification over the exact bytes Stripe sent).
app.use(express.json({
  limit: '15mb',
  verify: (req, _res, buf) => { (req as any).rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ---------------------------------------------------------------------------
// Rate limiting: per-IP sliding window on the expensive / sensitive endpoints.
// The util existed but was never wired up; these guards keep the free AI tier,
// owner-verify, and mail endpoints from being hammered into quota exhaustion.
// ---------------------------------------------------------------------------
function clientIp(req: any): string {
  return (
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

const AI_TRIAL_LIMIT = 10;      // 10 analyze-fish calls/min per IP (free trial quota care)
const AI_AUTHED_LIMIT = 30;     // 30/min with owner secret (builders/tests)
const VERIFY_LIMIT = 10;        // 10 owner-verify attempts/min per IP
const MAIL_LIMIT = 5;           // 5 mail sends/min per IP (spam guard on free Resend)

function rateLimitMiddleware(limit: number, windowMs: number, label: string) {
  return (req: any, res: any, next: any) => {
    const key = `${label}:${clientIp(req)}`;
    const lim = rateLimit(key, limit, windowMs);
    for (const [k, v] of Object.entries(rateLimitHeaders(lim))) res.setHeader(k, v);
    if (!lim.ok) {
      return res.status(429).json({ error: 'Too many requests. Slow down and try again shortly.', retryAfterSeconds: Math.ceil(lim.retryAfterMs / 1000) });
    }
    next();
  };
}

// Public read-only Ontario open data endpoint, separate from private app AI routes.
app.get('/api/ontario-data', (req, res) => { void ontarioDataHandler(req, res); });

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'FishAI Multi-Modal Server', timestamp: new Date().toISOString() });
});

// Owner sign-in: verify the app password (timing-safe). Public endpoint:
// it exists so the app can validate a password BEFORE storing it locally.
app.post('/api/auth/owner-verify', rateLimitMiddleware(VERIFY_LIMIT, 60_000, 'verify'), (req, res) => {
  if (!appSecret) {
    return res.status(503).json({
      error: 'API auth is not configured. Set FISH_APP_SECRET in the server environment.',
      code: 'AUTH_NOT_CONFIGURED',
    });
  }
  const { password } = (req.body || {}) as { password?: string };
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ ok: false, error: 'Password is required.' });
  }
  const a = Buffer.from(appSecret);
  const b = Buffer.from(password);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) {
    return res.status(401).json({ ok: false, error: 'Incorrect password.' });
  }
  res.json({ ok: true, role: 'owner' });
});

// API auth gate: all /api/ai routes require either:
//   1. the owner app secret (x-fish-app-secret === FISH_APP_SECRET), or
//   2. an entitled Stripe customer (x-fish-customer-id with an active
//      subscription or in-progress trial).
// 503 when the owner secret env var is missing; 402 when a public caller has
// no active entitlement. Without Stripe configured, only the owner secret
// works (pre-launch behavior).
const appSecret = process.env.FISH_APP_SECRET || '';
const rateLimitAi = (req: any, res: any, next: any) =>
  rateLimitMiddleware(req.get('x-fish-app-secret') === appSecret ? AI_AUTHED_LIMIT : AI_TRIAL_LIMIT, 60_000, 'ai')(req, res, next);

app.use('/api/ai', rateLimitAi, async (req, res, next) => {
  if (!appSecret) {
    return res.status(503).json({
      error: 'API auth is not configured. Set FISH_APP_SECRET in the server environment.',
      code: 'AUTH_NOT_CONFIGURED',
    });
  }
  const provided = req.get('x-fish-app-secret') || '';
  if (provided === appSecret) return next();

  if (!billingStripe) {
    return res.status(401).json({ error: 'AI analysis is locked.' });
  }
  const customerId = req.get('x-fish-customer-id') || '';
  if (!customerId) {
    return res.status(402).json({
      error: 'Start your free trial to unlock AI analysis.',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }
  const entitled = await customerIsEntitled(customerId);
  if (entitled) return next();
  return res.status(402).json({
    error: 'An active subscription is required to use AI analysis.',
    code: 'SUBSCRIPTION_REQUIRED',
  });
});

// AI Routes
app.use('/api/ai', aiRouter);

// Billing Routes (checkout / status / portal / webhook)
app.use('/api/billing', billingRouter);

// Mail Routes (Resend — test sender / future outreach + receipts)
app.use('/api/mail', mailRouter);
