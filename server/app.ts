import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { aiRouter } from './routes/aiRoutes.js';
import { billingRouter } from './routes/billingRoutes.js';
import { rateLimit, rateLimitHeaders } from './utils/rateLimit.js';
import {
  OWNER_COOKIE,
  SUBSCRIBER_COOKIE,
  clearSessionCookie,
  cookieSession,
  issueSession,
  sessionConfigured,
  sessionCookie,
} from './utils/session.js';

export const app = express();

const APP_URL = (process.env.APP_URL || 'https://fishai.shop').replace(/\/$/, '');
const OWNER_SESSION_TTL_SECONDS = 12 * 60 * 60;
const appSecret = process.env.FISH_APP_SECRET || '';

app.disable('x-powered-by');

const allowedOrigins = new Set([
  APP_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    if (process.env.VERCEL_ENV !== 'production' && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  maxAge: 86400,
}));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use(express.json({
  limit: '4mb',
  verify: (req, _res, buf) => { (req as any).rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

function clientIp(req: any): string {
  return (
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function rateLimitMiddleware(
  limit: number,
  windowMs: number,
  label: string,
  identity?: (req: any) => string,
) {
  return (req: any, res: any, next: any) => {
    const suffix = identity?.(req) || clientIp(req);
    const result = rateLimit(`${label}:${suffix}`, limit, windowMs);
    for (const [name, value] of Object.entries(rateLimitHeaders(result))) {
      res.setHeader(name, value);
    }
    if (!result.ok) {
      return res.status(429).json({
        error: 'Too many requests. Try again shortly.',
        code: 'RATE_LIMITED',
        retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000),
      });
    }
    return next();
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fishai-api', timestamp: new Date().toISOString() });
});

app.get('/api/auth/status', (req, res) => {
  const owner = cookieSession(req, OWNER_COOKIE, ['owner']);
  res.json({ owner: !!owner });
});

app.post(
  '/api/auth/owner-verify',
  rateLimitMiddleware(8, 15 * 60_000, 'owner-login'),
  (req, res) => {
    if (!appSecret || !sessionConfigured()) {
      return res.status(503).json({
        error: 'Owner authentication is not configured.',
        code: 'AUTH_NOT_CONFIGURED',
      });
    }

    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password || password.length > 256) {
      return res.status(400).json({ ok: false, error: 'Password is required.' });
    }

    const expected = Buffer.from(appSecret, 'utf8');
    const provided = Buffer.from(password, 'utf8');
    const ok = expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
    if (!ok) return res.status(401).json({ ok: false, error: 'Incorrect password.' });

    const token = issueSession('owner', 'owner', OWNER_SESSION_TTL_SECONDS);
    res.setHeader('Set-Cookie', sessionCookie(OWNER_COOKIE, token, OWNER_SESSION_TTL_SECONDS));
    return res.json({ ok: true, role: 'owner' });
  },
);

app.post('/api/auth/logout', (_req, res) => {
  res.setHeader('Set-Cookie', clearSessionCookie(OWNER_COOKIE));
  return res.json({ ok: true });
});

app.use('/api/ai', (req, res, next) => {
  const owner = cookieSession(req, OWNER_COOKIE, ['owner']);
  const subscriber = cookieSession(req, SUBSCRIBER_COOKIE, ['subscriber']);
  const claims = owner || subscriber;
  if (!claims) {
    return res.status(401).json({
      error: 'A valid FishAI session is required.',
      code: 'SESSION_REQUIRED',
    });
  }
  (req as any).fishSession = claims;
  return next();
});

app.use(
  '/api/ai',
  rateLimitMiddleware(
    8,
    60_000,
    'ai',
    (req) => {
      const claims = (req as any).fishSession;
      return `${claims?.kind || 'unknown'}:${claims?.sub || clientIp(req)}`;
    },
  ),
);

app.use('/api/ai', aiRouter);
app.use('/api/billing', billingRouter);

app.use((error: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled API error:', error?.message || error);
  res.status(500).json({ error: 'Unexpected server error.' });
});
