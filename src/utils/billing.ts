// Billing helpers — Stripe Checkout trial flow, Stripe as source of truth.
// The Stripe customer id is stored on this device and sent with AI calls so
// the server can verify entitlement live (x-fish-customer-id header).
const CUSTOMER_KEY = 'fishai.customerId';
const EMAIL_KEY = 'fishai.email';

export interface BillingStatus {
  entitled: boolean;
  status: string; // 'trialing' | 'active' | 'none' | ...
  trialEndsAt: number | null;
  periodEnd: number | null;
  customerId: string;
}

export function getCustomerId(): string {
  try {
    return localStorage.getItem(CUSTOMER_KEY) || '';
  } catch {
    return '';
  }
}

export function setCustomerId(id: string): void {
  try {
    localStorage.setItem(CUSTOMER_KEY, id);
  } catch {
    /* storage unavailable */
  }
}

export function getStoredEmail(): string {
  try {
    return localStorage.getItem(EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredEmail(email: string): void {
  try {
    localStorage.setItem(EMAIL_KEY, email);
  } catch {
    /* storage unavailable */
  }
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  const customerId = getCustomerId();
  if (!customerId) {
    return { entitled: false, status: 'none', trialEndsAt: null, periodEnd: null, customerId: '' };
  }
  try {
    const resp = await fetch(`/api/billing/status?customer_id=${encodeURIComponent(customerId)}`);
    return (await resp.json()) as BillingStatus;
  } catch {
    return { entitled: false, status: 'none', trialEndsAt: null, periodEnd: null, customerId };
  }
}

// Start checkout (or get the portal URL if already entitled).
export async function startCheckout(email: string): Promise<{ url: string; customerId: string }> {
  const resp = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await resp.json();
  if (!resp.ok || !data.url) {
    throw new Error(data?.error || 'Could not start checkout. Please try again.');
  }
  if (data.customerId) setCustomerId(data.customerId);
  setStoredEmail(email);
  return data;
}

export async function openBillingPortal(): Promise<string> {
  const customerId = getCustomerId();
  if (!customerId) throw new Error('No account on this device.');
  const resp = await fetch('/api/billing/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId }),
  });
  const data = await resp.json();
  if (!resp.ok || !data.url) {
    throw new Error(data?.error || 'Could not open the billing portal.');
  }
  return data.url;
}
