import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { fetchWithTimeout, withTimeout } from '../utils/timeoutFetch.js';

export const aiRouter = Router();

// ---------------------------------------------------------------------------
// Vision providers, best identification quality first.
//
// Fine-grained species benchmarks (birds, 2026) put GPT-class and Gemini 2.5
// Pro well ahead of small open VLMs. The old default, gemini-flash-lite, is
// the cheap tier and the weak link for bass-vs-sunfish calls and strict JSON.
//
// Order when a key exists:
//   1. OpenAI gpt-4.1-mini (vision + reliable JSON, stronger than flash-lite)
//   2. Anthropic Sonnet (careful IDs, honest low confidence)
//   3. Gemini 2.5 Flash (same Google key, much better than flash-lite)
//      flash-lite is only the fallback if 2.5 Flash rejects the model name
//   4. OpenRouter free VLMs
//   5. Groq
// We never invent a species if every configured provider fails.
// ---------------------------------------------------------------------------
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

const geminiClients = GEMINI_KEYS.map((apiKey) => new GoogleGenAI({ apiKey }));

const OPENROUTER_MODELS = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
];
const GROQ_MODEL = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b';

const VISION_TIMEOUT_MS = 22_000;

const configured = !!(OPENAI_KEY || ANTHROPIC_KEY || GEMINI_KEYS.length || OPENROUTER_KEY || GROQ_KEY);

function providerChain(): string[] {
  const chain: string[] = [];
  if (OPENAI_KEY) chain.push(`openai:${OPENAI_MODEL}`);
  if (ANTHROPIC_KEY) chain.push(`anthropic:${ANTHROPIC_MODEL}`);
  for (const model of GEMINI_MODELS) {
    if (GEMINI_KEYS.length) chain.push(`gemini:${model}`);
  }
  if (OPENROUTER_KEY) chain.push(`openrouter:${OPENROUTER_MODELS[0]}`);
  if (GROQ_KEY) chain.push(`groq:${GROQ_MODEL}`);
  return chain;
}

function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no JSON object in model response');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function stamp(parsed: unknown, provider: string): unknown {
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return { ...(parsed as Record<string, unknown>), visionProvider: provider };
  }
  return parsed;
}

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
  }, VISION_TIMEOUT_MS);
  const data: any = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${model}: empty response`);
  return extractJson(content);
}

async function anthropicVisionCall(
  prompt: string,
  imageBase64: string,
  mimeType: string,
): Promise<unknown> {
  const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2000,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  }, VISION_TIMEOUT_MS);
  const data: any = await res.json();
  const block = Array.isArray(data?.content)
    ? data.content.find((c: { type?: string; text?: string }) => c.type === 'text')
    : null;
  if (!block?.text) throw new Error(`${ANTHROPIC_MODEL}: empty response`);
  return extractJson(block.text);
}

async function geminiVisionCall(client: GoogleGenAI, model: string, prompt: string, imageBase64: string, mimeType: string): Promise<unknown> {
  const response = await withTimeout(
    client.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
      config: { responseMimeType: 'application/json', temperature: 0.2 },
    }),
    VISION_TIMEOUT_MS,
  );
  return extractJson(response.text || '');
}

aiRouter.get('/status', (_req, res) => {
  const chain = providerChain();
  res.json({
    configured,
    provider: chain[0]?.split(':')[0] ?? null,
    model: chain[0] ?? null,
    chain,
  });
});

aiRouter.post('/analyze-fish', async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg', referenceObjectHint, location } = req.body;
  // location: 'ontario' | 'us' | undefined (defaults to generic)

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image base64 data is required for computer vision analysis.' });
  }

  if (!configured) {
    return res.status(503).json({
      error: 'AI vision is not configured. Set OPENAI_API_KEY (preferred), ANTHROPIC_API_KEY, or GEMINI_API_KEY. OpenRouter and Groq still work as last-resort fallbacks.',
      code: 'AI_NOT_CONFIGURED',
    });
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  if (cleanBase64.length < 2000) {
    return res.status(400).json({ error: 'Image data is too small to analyze. Upload a real photo.' });
  }

  const prompt = `You are FishAI, an expert fisheries biologist and fishing guide.
${location === 'ontario'
    ? 'The user is fishing in ONTARIO, CANADA. Use Ontario Fishing Regulations Summary 2026 for regulatory info (sport/conservation license limits, size restrictions, seasons). Note that rules vary by Fisheries Management Zone (FMZ).'
    : 'The user is fishing in the UNITED STATES. Use typical US state fishing regulations for regulatory info. Note that rules vary by state.'}

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
- Keep regulatory info based on the user's location. If location is "ontario", use Ontario Fishing Regulations Summary 2026 (sport/conservation limits, FMZ variations). If location is "us" or unspecified, use typical US state regulations. Always flag in protectionNotice that regulations vary by jurisdiction and the user should verify current rules. Never present estimates as legal advice.
- The user may provide a scale reference hint: "${referenceObjectHint || 'none'}". Use it if visible.
- Length/weight must be ESTIMATES clearly derived from proportions; use realistic ranges.`;

  const attempts: { name: string; run: () => Promise<unknown> }[] = [];

  if (OPENAI_KEY) {
    attempts.push({
      name: `openai:${OPENAI_MODEL}`,
      run: () => openAiVisionCall(
        'https://api.openai.com/v1', OPENAI_KEY, OPENAI_MODEL,
        prompt, cleanBase64, mimeType,
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
    for (const orModel of OPENROUTER_MODELS) {
      attempts.push({
        name: `openrouter:${orModel}`,
        run: () => openAiVisionCall(
          'https://openrouter.ai/api/v1', OPENROUTER_KEY, orModel,
          prompt, cleanBase64, mimeType,
        ),
      });
    }
  }

  if (GROQ_KEY) {
    attempts.push({
      name: `groq:${GROQ_MODEL}`,
      run: () => openAiVisionCall(
        'https://api.groq.com/openai/v1', GROQ_KEY, GROQ_MODEL,
        prompt, cleanBase64, mimeType, { max_tokens: 4000 },
      ),
    });
  }

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      const parsed = await attempt.run();
      return res.json(stamp(parsed, attempt.name));
    } catch (err: any) {
      const message = err?.message || String(err);
      errors.push(`${attempt.name}: ${message}`);
      console.error(`Vision ${attempt.name} failed:`, message);
    }
  }

  return res.status(502).json({
    error: 'All configured AI vision providers failed. Please try again.',
    detail: errors.slice(-3),
  });
});
