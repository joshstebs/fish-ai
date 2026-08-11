# FishAI — Personal Fishing Intelligence

A personal fishing assistant that helps you **plan → fish → record → learn → improve**. Every catch you log makes the app smarter for *you*.

## What's inside (13 modules)

| Tab | What it does |
|---|---|
| **Fish Report** | Honest, personalized conditions score for your target species — real live weather (Open-Meteo), real solunar math, and **your** catch history. Every factor is shown with why it helps or hurts, plus confidence and a caveat. |
| **Vision** | AI fish identification + size/weight estimation via Gemini vision (needs `GEMINI_API_KEY`). Never fakes results: without a key it returns an honest error, and you can correct the species. |
| **Logbook** | Catch log with search/filter/CSV export, plus **Quick Log** for fast manual entry with optional live-weather attach. |
| **Insights** | The personal learning loop: best hours, top lures, top spots, best conditions, species stats, personal bests — every insight shows its sample size and confidence. |
| **Assistant** | Chat that answers from **your** data: where to fish, what lure, when to go, why you're not catching. Offline rule-based — no fake advice. |
| **Spot Map** | Saved spots with real GPS capture, privacy levels (Private/Friends/Approximate/Public), catch history per spot. |
| Tackle AI, Solunar, Pressure, Tackle Box, Trophies, Livewell, Academy | Rule-based tackle matching; **real** astronomical calculations; **live** barometric pressure + trend; persisted gear inventory (starts empty); achievements computed from real catches; timers; beginner guides. |

## Truthfulness rules (hard requirements)

- **No fabricated data.** A new user starts with an empty logbook, empty spots, empty tackle box.
- Weather is live from [Open-Meteo](https://open-meteo.com) (free, no key). If unavailable, the app says so instead of inventing conditions.
- Moon phase, sunrise/sunset, and solunar windows are computed from orbital math — no hardcoded tables.
- AI vision returns an honest 503 when `GEMINI_API_KEY` is missing. Insights and the assistant show sample sizes and confidence so small samples are obviously weak.
- Spot coordinates are private by default and never leave the device.

## Running

```bash
npm install
npm run dev:all        # backend on :3002 + frontend on :5173
```

For AI vision, copy `.env.example` to `.env` and set `GEMINI_API_KEY`.

Everything else (weather, solunar, insights, assistant, logbook) works with no keys.

## Stack

Vite + React 18 + TypeScript + Tailwind + Express (`@google/genai` for vision).
