# FishAI Promo Video — How It Was Made (Aug 2026)

> Full runbook for future agents: the Hermes skill `fishai-promo-video`
> (`~/.hermes/skills/media/fishai-promo-video/`) contains the complete pipeline,
> scripts, and pitfalls. This file is the repo-side summary so the knowledge
> lives with the codebase too.

## The final product
**FishAI_Promo_F_v2.mp4** — 14.2s, 1080x1920 (true 9:16), 30fps, silent video +
music muxed from Josh's VN export.

| # | Segment | Duration | Source |
|---|---------|----------|--------|
| 1 | "SNAP A PIC. KNOW THE FISH." opener card | 1.2s | PIL card (scripts/promo_cards.py) |
| 2 | Angler catching fish at evening | 1.8s | Mixkit clip 29435 |
| 3 | Real app: "Processing Computer Vision..." spinner | 1.8s | Josh's recording @ 0:29.2 |
| 4 | Real app: result — Freshwater Drum, 95%, 17-21", ~3.5 lbs (slow zoom) | 4.5s | Josh's recording @ 0:32.0 |
| 5 | Real app: harvest rules / legality check | 2.0s | Josh's recording @ 0:38.0 |
| 6 | Angler reeling at dawn | 1.6s | Mixkit clip 47138 |
| 7 | CTA card: FISHAI / one-stop app / $7.99 trial / fishai.shop | 2.8s | PIL card |

Transitions: 0.25s xfade fades.

## Key rules (violations caused real user rejections)
1. **Canvas must be true 9:16 (1080x1920).** The original 780x1688 canvas (9:19.4)
   caused the end-card text to fall under platform UI ("text doesn't fit on screen").
2. **Safe zone:** card text between ~44% height and ≥580px from bottom.
3. **Pacing:** 10-15s total, clips 1.8-2.2s, fades 0.25s (Josh: "Maybe 10-15 seconds").
4. **Real app footage only** — no fake data. Josh records his own app demos.
5. **Stock crop:** crop to 405x720 (exact 9:16) before scaling — direct scale
   stretched footage ~21% vertically.
6. **Silent base + music mux:** `ffmpeg -i NEW.mp4 -i JOSH_FINAL.mp4 -map 0:v -map 1:a -c:v copy -c:a aac -shortest`.

## Sources
- Stock: Mixkit (free commercial), direct URLs `https://assets.mixkit.co/videos/{id}/{id}-720.mp4`
  (ids: 29435, 47138, 47137, 31470, 45797, 2048, 2050, 22964).
- Cards: PIL + DejaVu, navy #0D1423 / emerald #34D399 — scripts/promo_cards.py.
- Josh's app recording (45.5s, 580x1280, silent): crops `580:1031:0:124` → 1080x1920.
- Verification: tesseract OCR on extracted frames (vision APIs unreliable);
  audio check via `ffmpeg -af volumedetect` (≈-11dB = music, ≈-91dB = silent).

## Iterations
A (23.5s cinematic), B (19.4s punchy), C (20.4s square 1:1 for IG), D (34.2s extended),
E (12.6s short, no app demo), **F (14.2s final with real app demo)**,
F_v2 = F + Josh's music + fishai.shop URL.

## Related
- `/home/ubuntu/FishAI_Launch_Kit.md` — per-platform captions (TikTok/Reels/X/Reddit/FB/PH).
- Hermes skill `fishai-promo-video` — pipeline + scripts + pitfalls.
