import { Router } from 'express';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { rateLimit, rateLimitHeaders } from '../utils/rateLimit.js';
import {
  SUBSCRIBER_COOKIE,
  cookieSession,
  issueSession,
  sessionConfigured,
  sessionCookie,
  verifySession,
} from '../utils/session.js';

export const billingRouter = Router();

const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
const resend: Resend | null = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const PRICE_ID = process.env.STRIPE_PRICE_ID || '';
const TRIAL_DAYS = 7;
const APP_URL = (process.env.APP_URL || 'https://fishai.shop').replace(/\/$/, '');
const RESEND_FROM = process.env.RESEND_FROM || 'FishAI <onboarding@resend.dev>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBSCRIBER_TTL_SECONDS = 30 * 60;
const RECOVERY_TTL_SECONDS = 10 * 60;

function isEntitled(sub: Stripe.Subscription): boolean {
  return sub.status === 'trialing' || sub.status === 'active';
}

async function customerIsEntitled(customerId: string): Promise<{
  entitled: boolean;
  subscription: Stripe.Subscription | null;
}> {
  if (!stripe || !customerId) return { entitled: false, subscription: null };
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });
    const subscription = subscriptions.data.find(isEntitled) || null;
    return { entitled: !!subscription, subscription };
  } catch (error) {
    console.error('Stripe entitlement check failed:', error instanceof Error ? error.message : error);
    return { entitled: false, subscription: null };
  }
}

function clientIp(req: any): string {
  return (
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function enforceLimit(
  req: any,
  res: any,
  label: string,
  identity: string,
  limit: number,
  windowMs: number,
): boolean {
  const key = `${label}:${clientIp(req)}:${identity.toLowerCase()}`;
  const result = rateLimit(key, limit, windowMs);
  for (const [name, value] of Object.entries(rateLimitHeaders(result))) {
    res.setHeader(name, value);
  }
  if (!result.ok) {
    res.status(429).json({
      error: 'Too many requests. Try again later.',
      code: 'RATE_LIMITED',
      retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000),
    });
    return false;
  }
  return true;
}

function statusPayload(subscription: Stripe.Subscription | null) {
  return {
    entitled: !!subscription,
    status: subscription?.status || 'none',
    trialEndsAt: subscription?.trial_end ?? null,
    periodEnd: subscription ? ((subscription as any).current_period_end ?? null) : null,
  };
}

function setSubscriberCookie(res: any, customerId: string) {
  const token = issueSession('subscriber', customerId, SUBSCRIBER_TTL_SECONDS);
  res.setHeader('Set-Cookie', sessionCookie(SUBSCRIBER_COOKIE, token, SUBSCRIBER_TTL_SECONDS));
}

billingRouter.post('/checkout', async (req, res) => {
  if (!stripe || !PRICE_ID || !sessionConfigured()) {
    return res.status(503).json({
      error: 'Billing is not fully configured.',
      code: 'BILLING_NOT_CONFIGURED',
    });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!enforceLimit(req, res, 'checkout', email, 5, 60 * 60_000)) return;

  try {
    const matches = (await stripe.customers.list({ email, limit: 10 })).data;
    let customer = matches[0] || null;

    for (const candidate of matches) {
      const { entitled } = await customerIsEntitled(candidate.id);
      if (entitled) {
        return res.status(409).json({
          error: 'An active FishAI subscription already exists for this email. Use secure account recovery instead of starting a second subscription.',
          code: 'ACCOUNT_EXISTS',
        });
      }
    }

    if (!customer) {
      customer = await stripe.customers.create({
        email,
        metadata: { app: 'fishai' },
      });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { app: 'fishai' },
      },
      metadata: { app: 'fishai' },
      success_url: `${APP_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/?checkout=canceled`,
      allow_promotion_codes: true,
    });

    if (!checkout.url) throw new Error('Stripe did not return a checkout URL.');
    return res.json({ url: checkout.url });
  } catch (error) {
    console.error('Stripe checkout failed:', error instanceof Error ? error.message : error);
    return res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }
});

billingRouter.post('/claim', async (req, res) => {
  if (!stripe || !sessionConfigured()) {
    return res.status(503).json({ error: 'Billing is not configured.' });
  }

  const sessionId = String(req.body?.sessionId || '');
  if (!/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId) || sessionId.length > 255) {
    return res.status(400).json({ error: 'Invalid checkout session.' });
  }
  if (!enforceLimit(req, res, 'claim', sessionId.slice(0, 32), 10, 15 * 60_000)) return;

  try {
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    const customerId = typeof checkout.customer === 'string' ? checkout.customer : checkout.customer?.id;
    if (
      checkout.mode !== 'subscription' ||
      checkout.status !== 'complete' ||
      checkout.metadata?.app !== 'fishai' ||
      !customerId
    ) {
      return res.status(403).json({ error: 'This checkout session cannot authorize FishAI.' });
    }

    const { entitled, subscription } = await customerIsEntitled(customerId);
    if (!entitled || !subscription) {
      return res.status(402).json({
        error: 'An active subscription or trial was not found.',
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }

    setSubscriberCookie(res, customerId);
    return res.json(statusPayload(subscription));
  } catch (error) {
    console.error('Checkout claim failed:', error instanceof Error ? error.message : error);
    return res.status(400).json({ error: 'Could not verify checkout.' });
  }
});

billingRouter.get('/status', async (req, res) => {
  const claims = cookieSession(req, SUBSCRIBER_COOKIE, ['subscriber']);
  if (!claims) {
    return res.status(401).json({
      entitled: false,
      status: 'none',
      trialEndsAt: null,
      periodEnd: null,
      code: 'SESSION_REQUIRED',
    });
  }

  const { entitled, subscription } = await customerIsEntitled(claims.sub);
  if (!entitled || !subscription) {
    return res.status(402).json({
      entitled: false,
      status: 'none',
      trialEndsAt: null,
      periodEnd: null,
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }

  setSubscriberCookie(res, claims.sub);
  return res.json(statusPayload(subscription));
});

billingRouter.post('/portal', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Billing is not configured.' });

  const claims = cookieSession(req, SUBSCRIBER_COOKIE, ['subscriber']);
  if (!claims) {
    return res.status(401).json({ error: 'A secure subscriber session is required.' });
  }

  const { entitled } = await customerIsEntitled(claims.sub);
  if (!entitled) {
    return res.status(402).json({
      error: 'An active subscription is required.',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: claims.sub,
      return_url: `${APP_URL}/`,
    });
    return res.json({ url: portal.url });
  } catch (error) {
    console.error('Stripe portal failed:', error instanceof Error ? error.message : error);
    return res.status(500).json({ error: 'Could not open the billing portal.' });
  }
});

billingRouter.post('/recovery', async (req, res) => {
  if (!stripe || !resend || !sessionConfigured()) {
    return res.status(503).json({
      error: 'Secure email recovery is not configured.',
      code: 'RECOVERY_NOT_CONFIGURED',
    });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!enforceLimit(req, res, 'recovery', email, 3, 60 * 60_000)) return;

  const generic = {
    ok: true,
    message: 'If an active FishAI subscription exists for that email, a secure sign-in link has been sent.',
  };

  try {
    const customers = (await stripe.customers.list({ email, limit: 10 })).data;
    let entitledCustomer: Stripe.Customer | null = null;

    for (const customer of customers) {
      const entitlement = await customerIsEntitled(customer.id);
      if (entitlement.entitled) {
        entitledCustomer = customer;
        break;
      }
    }
    if (!entitledCustomer) return res.json(generic);

    const recoveryToken = issueSession('recovery', entitledCustomer.id, RECOVERY_TTL_SECONDS);
    const url = `${APP_URL}/?billing_recovery=${encodeURIComponent(recoveryToken)}`;
    const { error } = await resend.emails.send({
      from: RESEND_FROM,
      to: email,
      subject: 'Your secure FishAI sign-in link',
      html: `<p>Your secure FishAI sign-in link is valid for 10 minutes:</p><p><a href="${url}">Sign in to FishAI</a></p><p>If you did not request this, ignore this email.</p>`,
    });
    if (error) console.error('Recovery email failed:', error);
  } catch (error) {
    console.error('Recovery request failed:', error instanceof Error ? error.message : error);
  }

  return res.json(generic);
});

billingRouter.post('/recover-claim', async (req, res) => {
  if (!stripe || !sessionConfigured()) {
    return res.status(503).json({ error: 'Billing is not configured.' });
  }

  const token = String(req.body?.token || '');
  const claims = verifySession(token, ['recovery']);
  if (!claims) {
    return res.status(401).json({ error: 'This recovery link is invalid or expired.' });
  }

  const { entitled, subscription } = await customerIsEntitled(claims.sub);
  if (!entitled || !subscription) {
    return res.status(402).json({
      error: 'No active subscription was found.',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }

  setSubscriberCookie(res, claims.sub);
  return res.json(statusPayload(subscription));
});

billingRouter.post('/webhook', (req, res) => {
  const signature = req.get('stripe-signature') || '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!stripe || !secret) {
    return res.status(501).json({ error: 'Webhook is not configured.' });
  }

  try {
    const raw = (req as any).rawBody as Buffer | undefined;
    const event = stripe.webhooks.constructEvent(raw ?? Buffer.from(''), signature, secret);
    console.log('Stripe webhook accepted:', event.type, event.id);
    return res.json({ received: true });
  } catch {
    console.error('Stripe webhook signature verification failed.');
    return res.status(400).json({ error: 'Invalid webhook signature.' });
  }
});
