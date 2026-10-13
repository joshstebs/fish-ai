export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

export async function fetchMapData(url: string, signal: AbortSignal, timeoutMs = 10000) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) controller.abort();
  const timer = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error('Map service unavailable');
    const data = await response.json();
    if (data.error || !Array.isArray(data.features)) throw new Error('Map service returned an error');
    return data;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}

export const accessLabel = (p: Record<string, unknown>) => escapeHtml(p.SITE_NAME || p.ACCESS_POINT_NAME || p.NAME || p.DESCRIPTION || 'Fishing access point');
