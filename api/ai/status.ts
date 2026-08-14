// Vercel serverless function: /api/ai/status (self-contained)

export default async function handler(_req: any, res: any) {
  const providers: string[] = [];
  if (process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2 || process.env.VITE_GEMINI_API_KEY) providers.push('gemini');
  if (process.env.OPENROUTER_API_KEY) providers.push('openrouter');
  if (process.env.GROQ_API_KEY) providers.push('groq');

  res.json({
    configured: providers.length > 0,
    model: providers.includes('gemini') ? (process.env.GEMINI_MODEL || 'gemini-flash-lite-latest') : null,
    fallbacks: providers
      .filter((p) => p !== 'gemini')
      .map((p) => (p === 'openrouter' ? 'openrouter (nemotron VL free + rotate)' : 'groq (qwen3.6-27b)')),
  });
}
