const EMAIL_KEY = 'fishai.email';

export interface BillingStatus {
  authenticated?: boolean;
  entitled: boolean;
  status: string;
  trialEndsAt: number | null;
  periodEnd: number | null;
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
    localStorage.removeItem('fishai.customerId');
    localStorage.removeItem('fishai.billingSession');
  } catch {
    /* storage unavailable */
  }
}

function emptyStatus(): BillingStatus {
  return { entitled: false, status: 'none', trialEndsAt: null, periodEnd: null };
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  try {
    const response = await fetch('/api/billing/status', {
      credentials: 'same-origin',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return emptyStatus();

    return {
      authenticated: !!data.authenticated,
    entitled: !!data.entitled,
      status: String(data.status || 'none'),
      trialEndsAt: typeof data.trialEndsAt === 'number' ? data.trialEndsAt : null,
      periodEnd: typeof data.periodEnd === 'number' ? data.periodEnd : null,
    };
  } catch {
    return emptyStatus();
  }
}

export async function startCheckout(email: string): Promise<{ url: string }> {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ email }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data?.url !== 'string') {
    const error = new Error(data?.error || 'Could not start checkout. Please try again.');
    (error as Error & { code?: string }).code = data?.code;
    throw error;
  }
  setStoredEmail(email);
  return { url: data.url };
}

export async function claimCheckoutSession(sessionId: string): Promise<BillingStatus> {
  const response = await fetch('/api/billing/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ sessionId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Could not verify checkout.');
  return {
    authenticated: !!data.authenticated,
    entitled: !!data.entitled,
    status: String(data.status || 'none'),
    trialEndsAt: typeof data.trialEndsAt === 'number' ? data.trialEndsAt : null,
    periodEnd: typeof data.periodEnd === 'number' ? data.periodEnd : null,
  };
}

export async function requestAccountRecovery(email: string): Promise<string> {
  const response = await fetch('/api/billing/recovery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ email }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Could not start secure recovery.');
  return data?.message || 'If an active account exists, a secure sign-in link has been sent.';
}

export async function claimRecoveryToken(token: string): Promise<BillingStatus> {
  const response = await fetch('/api/billing/recover-claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ token }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Could not complete secure recovery.');
  return {
    authenticated: !!data.authenticated,
    entitled: !!data.entitled,
    status: String(data.status || 'none'),
    trialEndsAt: typeof data.trialEndsAt === 'number' ? data.trialEndsAt : null,
    periodEnd: typeof data.periodEnd === 'number' ? data.periodEnd : null,
  };
}

export async function openBillingPortal(): Promise<string> {
  const response = await fetch('/api/billing/portal', {
    method: 'POST',
    credentials: 'same-origin',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data?.url !== 'string') {
    throw new Error(data?.error || 'Could not open the billing portal.');
  }
  return data.url;
}
