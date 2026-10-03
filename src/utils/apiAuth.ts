export async function fetchOwnerStatus(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/status', { credentials: 'same-origin' });
    if (!response.ok) return false;
    const body = await response.json();
    return body?.owner === true;
  } catch {
    return false;
  }
}

export async function signOut(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch {
    /* UI can still transition to signed-out; server cookie will expire naturally. */
  }
}

export async function verifyOwnerPassword(
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/owner-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ password }),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) return { ok: true };

    return {
      ok: false,
      error: body?.error || (response.status === 401 ? 'Incorrect password.' : `Sign-in failed (${response.status}).`),
    };
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection.' };
  }
}
