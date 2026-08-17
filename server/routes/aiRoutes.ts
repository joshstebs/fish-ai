import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { fetchWithTimeout, withTimeout } from '../utils/timeoutFetch.js';
import { rateLimit, rateLimitHeaders, pruneRateLimit } from '../utils/rateLimit.js';

export const aiRouter = Router();

// ---------------------------------------------------------------------------
// Provider configuration — each tier activates when its key is present.
// Order: Gemini (primary) -> OpenRouter free vision -> Groq (last resort).
// ---------------------------------------------------------------------------
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '',
  process.env.GEMINI_API_KEY_2 || '',
].filter(Boolean) as string[];
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const GROQ_KEY = process.env.GROQ_API_KEY || '';

const geminiClients = GEMINI_KEYS.map((apiKey) => new GoogleGenAI({ apiKey }));
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'; // lite tier = generous free quotas

// OpenRouter: tried in order until one returns parseable JSON (free tiers
// rate-limit per-model from shared upstream pools, so we rotate).
const OPENROUTER_MODELS = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
];
const GROQ_MODEL = 'qwen/qwen3.6-27b'; // vision-capable on Groq's free tier

const configured = !!(GEMINI_KEYS.length || OPENROUTER_KEY || GROQ_KEY);

// ============================================================================
// Helpers
// ============================================================================

/** Extract the JSON object embedded in a model's text reply (tolerates
 *  <think> blocks, markdown fences, and prose around the JSON). */
function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object in model response');
  return JSON.parse(cleaned.slice(start, end + 1));
}

/** OpenAI-compatible vision call (used by OpenRouter and Groq). */
async function openAiVisionCall(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  imageBase64: string,
  mimeType: string,
  extra: Record<string, unknown> = {},
): Promise<unknown> {
  const res = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
      ...extra,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${model}: HTTP ${res.status} ${body.slice(0, 200)}`);
  }
  const data: any = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${model}: empty response`);
  return extractJson(content);
}

// ============================================================================
// STATUS — lets the UI show whether real AI vision is configured
// ============================================================================
aiRouter.get('/status', (_req, res) => {
  const fallbacks: string[] = [];
  if (OPENROUTER_KEY) fallbacks.push(`openrouter (${OPENROUTER_MODELS[0]} + rotate)`);
  if (GROQ_KEY) fallbacks.push(`groq (${GROQ_MODEL})`);
  res.json({
    configured,
    model: GEMINI_KEYS.length ? MODEL : null,
    fallbacks,
  });
});

// ============================================================================
// FISH AI MULTI-MODAL COMPUTER VISION & DIMENSION ESTIMATOR ROUTE
// Tries Gemini first; on any failure falls back to OpenRouter free vision,
// then Groq. If NO provider is configured we return an honest 503 — we never
// fabricate species/measurement results.
// ============================================================================
aiRouter.post('/analyze-fish', async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg', referenceObjectHint } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image base64 data is required for computer vision analysis.' });
  }

  if (!configured) {
    return res.status(503).json({
      error: 'AI vision is not configured. Set GEMINI_API_KEY, OPENROUTER_API_KEY or GROQ_API_KEY in the server environment to enable real fish identification.',
      code: 'AI_NOT_CONFIGURED',
    });
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  // Reject tiny payloads that can't be a real photo
  if (cleanBase64.length < 2000) {
    return res.status(400).json({ error: 'Image data is too small to analyze — upload a real photo.' });
  }

  const prompt = `You are FishAI, an expert fisheries biologist and fishing guide.

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
- The user may provide a scale reference hint: "${referenceObjectHint || 'none'}". Use it if visible.
- Length/weight must be ESTIMATES clearly derived from proportions; use realistic ranges.`;

  const errors: string[] = [];

  // --- Tier 1: Gemini (rotates key1 -> key2) ------------------------------
  for (const client of geminiClients) {
    try {
      const response = await withTimeout(
        client.models.generateContent({
          model: MODEL,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: cleanBase64 } },
              ],
            },
          ],
          config: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
        12_000
      );
      const parsed = extractJson(response.text || '');
      return res.json(parsed);
    } catch (err: any) {
      errors.push(`gemini: ${err?.message || err}`);
      console.error('Gemini vision failed, trying fallbacks:', err?.message || err);
    }
  }

  // --- Tier 2: OpenRouter free vision --------------------------------------
  if (OPENROUTER_KEY) {
    for (const orModel of OPENROUTER_MODELS) {
      try {
        const parsed = await openAiVisionCall(
          'https://openrouter.ai/api/v1', OPENROUTER_KEY, orModel,
          prompt, cleanBase64, mimeType,
        );
        return res.json(parsed);
      } catch (err: any) {
        errors.push(`${orModel}: ${err?.message || err}`);
        console.error(`OpenRouter ${orModel} failed:`, err?.message || err);
      }
    }
  }

  // --- Tier 3: Groq (last resort) -------------------------------------------
  if (GROQ_KEY) {
    try {
      const parsed = await openAiVisionCall(
        'https://api.groq.com/openai/v1', GROQ_KEY, GROQ_MODEL,
        prompt, cleanBase64, mimeType, { max_tokens: 4000 },
      );
      return res.json(parsed);
    } catch (err: any) {
      errors.push(`groq: ${err?.message || err}`);
      console.error('Groq vision failed:', err?.message || err);
    }
  }

  return res.status(502).json({
    error: 'All configured AI vision providers failed. Please try again.',
    detail: errors.slice(-3),
  });
});
