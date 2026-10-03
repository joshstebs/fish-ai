import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { fetchWithTimeout, withTimeout } from '../utils/timeoutFetch.js';

export const aiRouter = Router();

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_VISION_MODEL || 'claude-sonnet-4-5';

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '',
  process.env.GEMINI_API_KEY_2 || '',
].filter(Boolean) as string[];
const GEMINI_MODELS = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL]
  : ['gemini-2.5-flash', 'gemini-flash-lite-latest'];

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const GROQ_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b';

const OPENROUTER_MODELS = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'google/gemma-4-31b-it:free',
];

const geminiClients = GEMINI_KEYS.map((apiKey) => new GoogleGenAI({ apiKey }));

const VISION_TIMEOUT_MS = Math.min(
  20_000,
  Math.max(5_000, Number(process.env.VISION_TIMEOUT_MS || 12_000)),
);
const MAX_PROVIDER_ATTEMPTS = Math.min(
  3,
  Math.max(1, Number(process.env.VISION_MAX_PROVIDER_ATTEMPTS || 2)),
);
const MAX_BASE64_CHARS = 3_200_000;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const configured = !!(
  OPENAI_KEY ||
  ANTHROPIC_KEY ||
  GEMINI_KEYS.length ||
  OPENROUTER_KEY ||
  GROQ_KEY
);

function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Provider returned no JSON object.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function numberInRange(value: unknown, min: number, max: number): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

function stringArray(value: unknown, max = 6): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function normalizedRange(
  value: unknown,
  fieldA: string,
  fieldB: string,
  min: number,
  max: number,
): { a: number; b: number } | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const a = numberInRange(record[fieldA], min, max);
  const b = numberInRange(record[fieldB], min, max);
  if (a == null || b == null) return null;
  return { a: Math.min(a, b), b: Math.max(a, b) };
}

function normalizeAnalysis(raw: unknown, provider: string) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Provider returned an invalid result.');
  }
  const data = raw as Record<string, unknown>;
  const commonName = text(data.commonName) || text(data.species);
  if (!commonName) throw new Error('Provider did not identify a species.');

  const length = normalizedRange(data.estimatedLength, 'minInches', 'maxInches', 0.5, 200);
  const weight = normalizedRange(data.estimatedWeight, 'minLbs', 'maxLbs', 0.01, 2000);
  const weightRecord = (data.estimatedWeight && typeof data.estimatedWeight === 'object')
    ? data.estimatedWeight as Record<string, unknown>
    : {};
  const averageLbs = numberInRange(weightRecord.averageLbs, 0.01, 2000);

  const ref = (data.referenceObject && typeof data.referenceObject === 'object')
    ? data.referenceObject as Record<string, unknown>
    : {};
  const tackle = (data.tackleRecommendations && typeof data.tackleRecommendations === 'object')
    ? data.tackleRecommendations as Record<string, unknown>
    : {};

  const rawMeasurementConfidence = text(data.measurementConfidence).toUpperCase();
  const measurementConfidence = ['HIGH', 'MEDIUM', 'LOW'].includes(rawMeasurementConfidence)
    ? rawMeasurementConfidence
    : 'LOW';

  return {
    species: text(data.species) || commonName,
    commonName,
    scientificName: text(data.scientificName),
    confidence: Math.round(numberInRange(data.confidence, 0, 100) ?? 0),
    visionProvider: provider,
    estimatedLength: length
      ? {
          minInches: length.a,
          maxInches: length.b,
          formatted: `${length.a} - ${length.b} inches`,
        }
      : null,
    estimatedWeight: weight
      ? {
          minLbs: weight.a,
          maxLbs: weight.b,
          averageLbs: averageLbs ?? Math.round(((weight.a + weight.b) / 2) * 100) / 100,
          formatted: `${weight.a} - ${weight.b} lbs`,
        }
      : null,
    measurementConfidence,
    referenceObject: {
      detected: ref.detected === true,
      description: text(ref.description),
    },
    proportionalAnalysis: text(data.proportionalAnalysis),
    keyCharacteristics: stringArray(data.keyCharacteristics, 5),
    tackleRecommendations: {
      topLiveBaits: stringArray(tackle.topLiveBaits, 3),
      topArtificialLures: stringArray(tackle.topArtificialLures, 4),
      presentationTechnique: text(tackle.presentationTechnique),
      waterColumnDepth: text(tackle.waterColumnDepth),
      recommendedLineAndRod: text(tackle.recommendedLineAndRod),
    },
    warnings: [
      'AI species identification can be wrong. Confirm uncertain IDs with a trusted field guide or local expert.',
      'Length and weight are visual estimates unless the photo contains a reliable object of known size.',
      'FishAI does not determine harvest legality. Check current official regulations for your exact jurisdiction, species, season, and waterbody.',
    ],
  };
}

async function openAiCompatibleVisionCall(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  imageBase64: string,
  mimeType: string,
  extra: Record<string, unknown> = {},
): Promise<unknown> {
  const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      }],
      ...extra,
    }),
  }, VISION_TIMEOUT_MS);

  const data: any = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(`${model}: empty response`);
  }
  return extractJson(content);
}

async function anthropicVisionCall(
  prompt: string,
  imageBase64: string,
  mimeType: string,
): Promise<unknown> {
  const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1200,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  }, VISION_TIMEOUT_MS);

  const data: any = await response.json();
  const block = Array.isArray(data?.content)
    ? data.content.find((item: { type?: string }) => item.type === 'text')
    : null;
  if (typeof block?.text !== 'string') throw new Error('Anthropic returned an empty response.');
  return extractJson(block.text);
}

async function geminiVisionCall(
  client: GoogleGenAI,
  model: string,
  prompt: string,
  imageBase64: string,
  mimeType: string,
): Promise<unknown> {
  const response = await withTimeout(
    client.models.generateContent({
      model,
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
    VISION_TIMEOUT_MS,
  );
  return extractJson(response.text || '');
}

aiRouter.get('/status', (_req, res) => {
  res.json({
    configured,
    maxProviderAttempts: MAX_PROVIDER_ATTEMPTS,
  });
});

aiRouter.post('/analyze-fish', async (req, res) => {
  if (!configured) {
    return res.status(503).json({
      error: 'AI vision is not configured.',
      code: 'AI_NOT_CONFIGURED',
    });
  }

  const input = req.body?.imageBase64;
  const referenceObjectHint = text(req.body?.referenceObjectHint).slice(0, 180);
  if (typeof input !== 'string') {
    return res.status(400).json({ error: 'A real image upload is required.' });
  }

  let mimeType = text(req.body?.mimeType, 'image/jpeg').toLowerCase();
  let cleanBase64 = input;
  const dataMatch = input.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/i);
  if (dataMatch) {
    mimeType = dataMatch[1].toLowerCase();
    cleanBase64 = dataMatch[2].replace(/\s/g, '');
  } else {
    cleanBase64 = input.replace(/\s/g, '');
  }

  if (!ALLOWED_MIME.has(mimeType)) {
    return res.status(415).json({ error: 'Only JPEG, PNG, and WebP images are supported.' });
  }
  if (cleanBase64.length < 2_000 || cleanBase64.length > MAX_BASE64_CHARS) {
    return res.status(413).json({
      error: 'Image payload is outside the supported size range. Upload a normal photo under the app limit.',
    });
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleanBase64)) {
    return res.status(400).json({ error: 'Image payload is malformed.' });
  }

  const prompt = `You are FishAI, a careful fisheries image-analysis assistant.

Analyze only what is visible in this user-supplied fish photo. Return STRICT JSON with this shape:
{
  "species": "Common Name (Scientific Name)",
  "commonName": "Common Name",
  "scientificName": "Scientific Name",
  "confidence": 0,
  "estimatedLength": null OR { "minInches": 0, "maxInches": 0 },
  "estimatedWeight": null OR { "minLbs": 0, "maxLbs": 0, "averageLbs": 0 },
  "measurementConfidence": "HIGH|MEDIUM|LOW",
  "referenceObject": { "detected": false, "description": "" },
  "proportionalAnalysis": "",
  "keyCharacteristics": [],
  "tackleRecommendations": {
    "topLiveBaits": [],
    "topArtificialLures": [],
    "presentationTechnique": "",
    "waterColumnDepth": "",
    "recommendedLineAndRod": ""
  }
}

Rules:
- Never invent a species certainty. If the image is ambiguous, lower confidence and state why.
- Length and weight are visual estimates, not measurements.
- If there is no defensible scale reference, use LOW measurementConfidence and return null for dimensions when a useful estimate cannot be supported.
- The user's optional known-size reference hint is: "${referenceObjectHint || 'none provided'}". Use it only if that object is actually visible.
- Do not provide legal status, bag limits, seasons, minimum lengths, or harvest decisions. Those require current official jurisdiction-specific regulations.
- Keep tackle suggestions general and species-appropriate.
- No markdown, no commentary outside JSON.`;

  const attempts: { name: string; run: () => Promise<unknown> }[] = [];

  if (OPENAI_KEY) {
    attempts.push({
      name: `openai:${OPENAI_MODEL}`,
      run: () => openAiCompatibleVisionCall(
        'https://api.openai.com/v1',
        OPENAI_KEY,
        OPENAI_MODEL,
        prompt,
        cleanBase64,
        mimeType,
        { response_format: { type: 'json_object' } },
      ),
    });
  }
  if (ANTHROPIC_KEY) {
    attempts.push({
      name: `anthropic:${ANTHROPIC_MODEL}`,
      run: () => anthropicVisionCall(prompt, cleanBase64, mimeType),
    });
  }
  for (const client of geminiClients) {
    for (const model of GEMINI_MODELS) {
      attempts.push({
        name: `gemini:${model}`,
        run: () => geminiVisionCall(client, model, prompt, cleanBase64, mimeType),
      });
    }
  }
  if (OPENROUTER_KEY) {
    for (const model of OPENROUTER_MODELS) {
      attempts.push({
        name: `openrouter:${model}`,
        run: () => openAiCompatibleVisionCall(
          'https://openrouter.ai/api/v1',
          OPENROUTER_KEY,
          model,
          prompt,
          cleanBase64,
          mimeType,
        ),
      });
    }
  }
  if (GROQ_KEY) {
    attempts.push({
      name: `groq:${GROQ_MODEL}`,
      run: () => openAiCompatibleVisionCall(
        'https://api.groq.com/openai/v1',
        GROQ_KEY,
        GROQ_MODEL,
        prompt,
        cleanBase64,
        mimeType,
      ),
    });
  }

  const boundedAttempts = attempts.slice(0, MAX_PROVIDER_ATTEMPTS);
  for (const attempt of boundedAttempts) {
    try {
      const raw = await attempt.run();
      return res.json(normalizeAnalysis(raw, attempt.name));
    } catch (error) {
      console.error(
        `Vision provider failed (${attempt.name}):`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return res.status(502).json({
    error: 'AI analysis is temporarily unavailable. No result was fabricated.',
    code: 'VISION_UNAVAILABLE',
  });
});
