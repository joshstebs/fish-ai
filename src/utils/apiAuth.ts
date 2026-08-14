// Shared app-secret auth for the AI API (/api/ai/*).
// The secret is stored on this device only (localStorage) and sent as the
// x-fish-app-secret header on AI calls. The server rejects AI calls without
// a matching secret (401), so the Gemini key/quota is never exposed publicly.
const STORAGE_KEY = 'fishai.appSecret';

export function getAppSecret(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setAppSecret(secret: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, secret);
  } catch {
    /* storage unavailable — session-only usage */
  }
}

export function isSignedIn(): boolean {
  return !!getAppSecret();
}

export function signOut(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

// Validate the owner password against the server BEFORE storing it locally.
// Returns { ok: true } on success, or { ok: false, error } with a message.
export async function verifyOwnerPassword(
  password: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const resp = await fetch('/api/auth/owner-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (resp.ok) return { ok: true };
    if (resp.status === 401) return { ok: false, error: 'Incorrect password.' };
    let msg = `Sign-in failed (${resp.status}).`;
    try {
      const body = await resp.json();
      if (body?.error) msg = body.error;
    } catch {
      /* keep default message */
    }
    return { ok: false, error: msg };
  } catch {
    return { ok: false, error: 'Could not reach the server — check your connection.' };
  }
}
