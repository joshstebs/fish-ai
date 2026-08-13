// Vercel serverless function: /api/ai/status
import { configuredProviders } from './_vision';

export default async function handler(_req: any, res: any) {
  const providers = configuredProviders();
  res.json({
    configured: providers.length > 0,
    model: providers.includes('gemini') ? 'gemini-flash-latest' : null,
    fallbacks: providers.filter((p) => p !== 'gemini').map((p) => (p === 'openrouter' ? 'openrouter (nemotron VL free + rotate)' : `groq (qwen3.6-27b)`)),
  });
}
