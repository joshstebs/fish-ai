import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';

export const aiRouter = Router();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MODEL = 'gemini-flash-latest'; // alias — always the current stable Flash (2.5-flash is deprecated for new keys)

// ============================================================================
// STATUS — lets the UI show whether real AI vision is configured
// ============================================================================
aiRouter.get('/status', (_req, res) => {
  res.json({
    configured: !!ai,
    model: ai ? MODEL : null,
  });
});

// ============================================================================
// FISH AI MULTI-MODAL COMPUTER VISION & DIMENSION ESTIMATOR ROUTE
// Uses Gemini vision when GEMINI_API_KEY is set. When it is NOT set, we
// return an honest 503 — we never fabricate species/measurement results.
// ============================================================================
aiRouter.post('/analyze-fish', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', referenceObjectHint } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required for computer vision analysis.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'AI vision is not configured. Set GEMINI_API_KEY in the server environment to enable real fish identification.',
        code: 'AI_NOT_CONFIGURED',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Reject tiny payloads that can't be a real photo
    if (cleanBase64.length < 2000) {
      return res.status(400).json({ error: 'Image data is too small to analyze — upload a real photo.' });
    }

    const prompt = `You are FishAI, an expert fisheries biologist and fishing guide.

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

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const raw = response.text || '';
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return res.status(502).json({ error: 'AI returned a malformed response. Please try again.' });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch (e) {
      return res.status(502).json({ error: 'AI returned unparseable JSON. Please try again.' });
    }

    res.json(parsed);
  } catch (err: any) {
    console.error('AI vision error:', err?.message || err);
    res.status(500).json({
      error: 'AI vision analysis failed. Please try again.',
      detail: err?.message || String(err),
    });
  }
});
