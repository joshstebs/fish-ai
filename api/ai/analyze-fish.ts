// Vercel serverless function: /api/ai/analyze-fish
// Same contract as the local Express route (server/routes/aiRoutes.ts).
import { analyzeWithProviders, configuredProviders } from '../../lib/vision';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { imageBase64, mimeType = 'image/jpeg', referenceObjectHint } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image base64 data is required for computer vision analysis.' });
  }

  if (configuredProviders().length === 0) {
    return res.status(503).json({
      error: 'AI vision is not configured. Set GEMINI_API_KEY, OPENROUTER_API_KEY or GROQ_API_KEY as Vercel environment variables to enable real fish identification.',
      code: 'AI_NOT_CONFIGURED',
    });
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  // Reject tiny payloads that can't be a real photo
  if (cleanBase64.length < 2000) {
    return res.status(400).json({ error: 'Image data is too small to analyze — upload a real photo.' });
  }

  try {
    const { json, provider } = await analyzeWithProviders(cleanBase64, mimeType, referenceObjectHint || 'none');
    res.setHeader('x-ai-provider', provider);
    return res.json(json);
  } catch (err: any) {
    console.error('analyze-fish failed:', err?.message || err);
    return res.status(502).json({
      error: 'All configured AI vision providers failed. Please try again.',
      detail: (err?.message || String(err)).slice(0, 400),
    });
  }
}
