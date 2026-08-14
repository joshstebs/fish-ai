import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';

export const aiRouter = Router();

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Primary Gemini model — alias that always points at the current stable Flash.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

// Optional fallback providers (OpenAI-compatible). Dormant until a key is set:
//   GROQ_API_KEY + GROQ_MODEL (default llama-3.2-90b-vision-preview)
//   OPENROUTER_API_KEY + OPENROUTER_MODEL (default qwen/qwen-2.5-vl-72b-instruct:free)
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.2-90b-vision-preview';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'qwen/qwen-2.5-vl-72b-instruct:free';

// ============================================================================
// STATUS — lets the UI show whether real AI vision is configured
// ============================================================================
aiRouter.get('/status', (_req, res) => {
  const providers: string[] = [];
  if (ai) providers.push(`gemini:${GEMINI_MODEL}`);
  if (GROQ_API_KEY) providers.push(`groq:${GROQ_MODEL}`);
  if (OPENROUTER_API_KEY) providers.push(`openrouter:${OPENROUTER_MODEL}`);
  res.json({
    configured: providers.length > 0,
    model: ai ? GEMINI_MODEL : null,
    fallbackModels: providers.slice(1),
  });
});

// ============================================================================
// PROMPT + JSON EXTRACTION (shared by every provider so results are identical)
// ============================================================================
function buildPrompt(referenceObjectHint: string | undefined): string {
  return `You are FishAI, an expert fisheries biologist and fishing guide.

Analyze the fish photo and return STRICT JSON (no markdown fences) with this exact shape:
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
}

function extractJson(raw: string): unknown {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('AI returned a malformed response. Please try again.');
  }
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new Error('AI returned unparseable JSON. Please try again.');
  }
}

// OpenAI-compatible vision call (Groq / OpenRouter share this wire format).
async function callOpenAICompat(
  baseUrl: string,
  key: string,
  model: string,
  cleanBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${cleanBase64}` },
            },
          ],
        },
      ],
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`${model} failed (${resp.status}): ${body.slice(0, 200)}`);
  }
  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text) {
    throw new Error(`${model} returned no content.`);
  }
  return text;
}

// ============================================================================
// FISH AI MULTI-MODAL COMPUTER VISION & DIMENSION ESTIMATOR ROUTE
// Tries Gemini first, then Groq, then OpenRouter (whichever keys are set).
// Never fabricates results — if every provider fails, we say so honestly.
// ============================================================================
aiRouter.post('/analyze-fish', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', referenceObjectHint } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required for computer vision analysis.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Reject tiny payloads that can't be a real photo
    if (cleanBase64.length < 2000) {
      return res.status(400).json({ error: 'Image data is too small to analyze — upload a real photo.' });
    }

    const prompt = buildPrompt(referenceObjectHint);
    const errors: string[] = [];

    // 1) Gemini (primary)
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
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
        });
        return res.json(extractJson(response.text || ''));
      } catch (err: any) {
        errors.push(`gemini: ${err?.message || err}`);
      }
    }

    // 2) Groq fallback
    if (GROQ_API_KEY) {
      try {
        const text = await callOpenAICompat(
          'https://api.groq.com/openai/v1',
          GROQ_API_KEY,
          GROQ_MODEL,
          cleanBase64,
          mimeType,
          prompt
        );
        return res.json(extractJson(text));
      } catch (err: any) {
        errors.push(`groq: ${err?.message || err}`);
      }
    }

    // 3) OpenRouter fallback
    if (OPENROUTER_API_KEY) {
      try {
        const text = await callOpenAICompat(
          'https://openrouter.ai/api/v1',
          OPENROUTER_API_KEY,
          OPENROUTER_MODEL,
          cleanBase64,
          mimeType,
          prompt
        );
        return res.json(extractJson(text));
      } catch (err: any) {
        errors.push(`openrouter: ${err?.message || err}`);
      }
    }

    const configured = errors.length > 0;
    if (!configured && !ai) {
      return res.status(503).json({
        error: 'AI vision is not configured. Set GEMINI_API_KEY (or GROQ_API_KEY / OPENROUTER_API_KEY) in the server environment to enable real fish identification.',
        code: 'AI_NOT_CONFIGURED',
      });
    }
    console.error('AI vision error:', errors.join(' | '));
    res.status(500).json({
      error: 'AI vision analysis failed. Please try again.',
      detail: errors.join(' | '),
    });
  } catch (err: any) {
    console.error('AI vision error:', err?.message || err);
    res.status(500).json({
      error: 'AI vision analysis failed. Please try again.',
      detail: err?.message || String(err),
    });
  }
});
