// Vercel serverless function: /api/ai/analyze-fish
// Self-contained (package.json is "type": "module" — Vercel ships functions
// unbundled, so NO relative imports). Same contract as the Express route.

const PROMPT = `You are FishAI, an expert fisheries biologist and fishing guide.

Analyze the fish photo and return STRICT JSON (no markdown fences, no thinking blocks) with this exact shape:
{
  "species": "Common Name (Scientific Name)",
  "commonName": "Common Name",
  "scientificName": "Scientific Name",
  "confidence": <0-100 integer>,
  "estimatedLength": { "minInches": <number>, "maxInches": <number>, "formatted": "X - Y inches (A - B cm)" },
  "estimatedWeight": { "minLbs": <number>, "maxLbs": <number>, "averageLbs": <number>, "formatted": "X - Y lbs (A - B kg)" },
  "referenceObject": { "detected": <boolean>, "description": "<what scale reference you used, or empty string>", "scaleFactor": "<ratio or empty>" },
  "proportionalAnalysis": "<1-2 sentence anatomical analysis>",
  "keyCharacteristics": ["<3-5 identifying traits>"],
  "regulatoryInfo": { "legalStatus": "HARVEST_ALLOWED|CATCH_AND_RELEASE_ONLY|PROTECTED|SEASONAL_RESTRICTION", "minLegalLengthInches": <number>, "maxLegalLengthInches": <number|null>, "dailyBagLimit": "<string>", "seasonStatus": "<string>", "protectionNotice": "<string>", "isCatchLegalForEstimatedSize": <boolean> },
  "tackleRecommendations": { "topLiveBaits": ["<1-3>"], "topArtificialLures": ["<2-4>"], "presentationTechnique": "<string>", "waterColumnDepth": "<string>", "recommendedLineAndRod": "<string>" }
}

RULES:
- If you cannot identify the species with reasonable confidence (<50%), set confidence to your best estimate and say so in proportionalAnalysis: "species uncertain".
- Keep regulatory info generic (typical state regulations) and flag in protectionNotice that regulations vary by state/province — never state a specific jurisdiction as fact.
- The user may provide a scale reference hint: "{{REFERENCE_HINT}}". Use it if visible.
- Length/weight must be ESTIMATES clearly derived from proportions; use realistic ranges.`;

const OPENROUTER_MODELS = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
];
const GROQ_MODEL = 'qwen/qwen3.6-27b';

function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object in model response');
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function analyzeWithProviders(
  imageBase64: string,
  mimeType: string,
  referenceObjectHint: string,
): Promise<{ json: any; provider: string }> {
  const prompt = PROMPT.replace('{{REFERENCE_HINT}}', referenceObjectHint || 'none');
  const errors: string[] = [];

  // Tier 1: Gemini (REST, no SDK) — rotates key1 -> key2
  const geminiKeys = [
    process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '',
    process.env.GEMINI_API_KEY_2 || '',
  ].filter(Boolean);
  for (const geminiKey of geminiKeys) {
    try {
      const data = await postJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'}:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {},
        {
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: imageBase64 } },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        },
      );
      const raw: string =
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
      if (!raw) throw new Error('gemini: empty response');
      return { json: extractJson(raw), provider: 'gemini' };
    } catch (err: any) {
      errors.push(`gemini: ${err?.message || err}`);
    }
  }

  // Tier 2: OpenRouter free vision
  const orKey = process.env.OPENROUTER_API_KEY || '';
  if (orKey) {
    for (const model of OPENROUTER_MODELS) {
      try {
        const data = await postJson(
          'https://openrouter.ai/api/v1/chat/completions',
          { Authorization: `Bearer ${orKey}` },
          {
            model,
            temperature: 0.2,
            max_tokens: 2000,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
                ],
              },
            ],
          },
        );
        const content: string | undefined = data?.choices?.[0]?.message?.content;
        if (!content) throw new Error(`${model}: empty response`);
        return { json: extractJson(content), provider: model };
      } catch (err: any) {
        errors.push(`${model}: ${err?.message || err}`);
      }
    }
  }

  // Tier 3: Groq
  const groqKey = process.env.GROQ_API_KEY || '';
  if (groqKey) {
    try {
      const data = await postJson(
        'https://api.groq.com/openai/v1/chat/completions',
        { Authorization: `Bearer ${groqKey}` },
        {
          model: GROQ_MODEL,
          temperature: 0.2,
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
              ],
            },
          ],
        },
      );
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error(`${GROQ_MODEL}: empty response`);
      return { json: extractJson(content), provider: GROQ_MODEL };
    } catch (err: any) {
      errors.push(`groq: ${err?.message || err}`);
    }
  }

  throw new Error(errors.join(' | ') || 'no AI providers configured');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { imageBase64, mimeType = 'image/jpeg', referenceObjectHint } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image base64 data is required for computer vision analysis.' });
  }

  const hasAnyKey = !!(
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY_2 ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.GROQ_API_KEY
  );
  if (!hasAnyKey) {
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
