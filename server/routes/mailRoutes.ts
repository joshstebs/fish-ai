import { Router } from 'express';
import { Resend } from 'resend';
import { rateLimit, rateLimitHeaders } from '../utils/rateLimit.js';

// Email routes: Resend with the key from environment (never hardcoded).
// Key lives in server/.env as RESEND_API_KEY (or sourced from ~/.resend_key on dev box).
export const mailRouter = Router();

const resend: Resend | null = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM || 'onboarding@resend.dev'; // replace once a domain is verified in Resend
const TO = process.env.RESEND_TO || 'josh.stebs@gmail.com';

// POST /api/mail/test: sends a hello-world to confirm the key works end to end.
// Body optional: { to?, subject?, html? } overrides.
// Rate-limited: 5 sends/min per IP (spam guard on the free Resend tier).
mailRouter.post('/test', (req, res, next) => {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  const lim = rateLimit(`mail:${ip}`, 5, 60_000);
  for (const [k, v] of Object.entries(rateLimitHeaders(lim))) res.setHeader(k, v);
  if (!lim.ok) {
    return res.status(429).json({ error: 'Too many emails. Wait a minute.', retryAfterSeconds: Math.ceil(lim.retryAfterMs / 1000) });
  }
  next();
}, async (req, res) => {
  if (!resend) {
    return res.status(503).json({ ok: false, error: 'RESEND_API_KEY not set in server/.env' });
  }
  const { to = TO, subject = 'Hello World', html = '<p>Congrats on sending your <strong>first email</strong>!</p>' } = req.body ?? {};
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) return res.status(400).json({ ok: false, error });
    return res.json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});