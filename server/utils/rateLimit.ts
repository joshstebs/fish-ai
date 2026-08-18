// In-memory sliding-window rate limiter (no deps).
// Guards the free AI + auth endpoints from abuse so quota survives real use.

type Bucket = { hits: number[]; resetAt: number };

const buckets = new Map<string, Bucket>();
const PRUNE_INTERVAL = 60_000;
let lastPrune = Date.now();

function prune(): void {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL) return;
  lastPrune = now;
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; retryAfterMs: number } {
  prune();
  const now = Date.now();
  const b = buckets.get(key) ?? { hits: [], resetAt: now + windowMs };
  if (b.resetAt < now) {
    b.hits = [];
    b.resetAt = now + windowMs;
  }
  b.hits = b.hits.filter(t => t > now - windowMs);
  b.hits.push(now);
  buckets.set(key, b);
  // allow exactly `limit` requests per window; reject the one after
  const over = b.hits.length > limit;
  return { ok: !over, remaining: Math.max(0, limit - b.hits.length), retryAfterMs: b.resetAt - now };
}

export function rateLimitHeaders(lim: { remaining: number; retryAfterMs: number }): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(lim.remaining),
    'X-RateLimit-Reset': String(Math.ceil(lim.retryAfterMs / 1000)),
  };
}

export function pruneRateLimit(): void {
  prune();
}
