# FishAI Marketing Plan & Asset Pack
*Generated autonomously by the cloud Hermes agent (Aug 2026) — objective: market FishAI (fishai.shop)*

## 0. Pricing (VERIFIED from app code — SettingsView)
- **Free forever**: catch logbook, spot tracker w/ GPS + real map, live barometric pressure, real solunar tables, tackle box, trophies, livewell timers, beginner guides, assistant.
- **PRO — $7.99/mo, 7-day free trial, cancel anytime** (Stripe, live): **AI fish photo estimator** (species ID + length/weight estimate with confidence), plus premium support of the learning loop.
- **Marketing rule**: NEVER call the whole app "free". Say "free core app" / "free to start" / "AI estimator: 7-day free trial". The trial IS the hook.

## 1. Positioning (the message, always)
- **"AI fishing intelligence that never lies"** — honest-AI differentiator (confidence scores, honest errors, learnable corrections).
- **"Try the AI catch estimator free for 7 days"** — the conversion hook.
- **Privacy-first**: "100% PRIVATE. YOU OWN YOUR DATA." (unique in this space).
- **Free core, $7.99 PRO**: logbook, pressure, solunar, spots are free forever.

## 2. Channels (ranked by ROI for a solo builder)
| Channel | Role | Effort | Need from Josh |
|---|---|---|---|
| Reddit (r/Fishing, r/FishingForBeginners, r/kayakfishing, r/bassfishing) | Launch spike | Low | u/Shatterday420 posts drafts (or laptop-agent API later) |
| X / Twitter | Ongoing presence + fishing hashtags | Low | xurl credentials wired |
| Facebook fishing groups | Community trust | Low | His FB account (posts drafts) |
| TikTok / IG Reels | The promo video (F_v2, 14.2s) | Low | His accounts (or laptop agent) |
| YouTube Shorts | Long-tail search | Low | His channel |
| Google/Bing SEO | Slow compounding | None | sitemap + Search Console later |
| Angler forums (iFish, In-Depth Outdoors, BC Fishing Forum) | Niche trust | Low | His accounts |

## 3. Ready-to-post assets (all pricing-accurate)

### X/Twitter thread (launch)
1. "Built an AI fishing companion that estimates your catch's size from a photo — and it *tells you when it's unsure*. 🎣👇"
2. "Point it at your catch → species ID + size/weight estimate + confidence score. Wrong call? One tap corrects it, and the app learns from that. The AI estimator is Pro — but the first 7 days are free."
3. "Everything else is free forever: catch logbook, GPS spot map, live barometric pressure, real solunar tables, tackle box, trophies, beginner guides."
4. "Privacy-first: your logbook, your spots, your data — 100% yours. No store install needed — works in your browser."
5. "Try it free: fishai.shop — and tell me what it gets wrong so it gets smarter."

### X post (video)
"AI measured my catch in seconds. 📏🎣 Species ID + size estimate with an honest confidence score — 7-day free trial at fishai.shop (free core app, no install)"

### Instagram caption
"📏 AI catch sizing with honest confidence scores — 7-day free trial! Free core app: live barometer, real solunar tables, GPS spot tracker, catch logbook. 100% private. 📍 fishai.shop #fishing #bassfishing #kayakfishing #flyfishing #icefishing #fishapp"

### Reddit post draft (r/Fishing) — CORRECTED
Title: "I built a fishing app with an AI catch estimator (7-day free trial) — and it's honest when it doesn't know"
Body: (see corrected copy below in chat / git history) — features + "free core app, AI estimator is Pro: $7.99/mo after a 7-day free trial, cancel anytime" + invite critique.

### Facebook group post
"Hey everyone — I built a fishing app: free core (logbook, live barometric pressure, real solunar tables, GPS spot map) + an AI photo estimator that IDs fish and estimates size with an honest confidence score (7-day free trial, $7.99/mo after). Fully private. Feedback welcome: fishai.shop"

### YouTube Shorts description
"AI fishing app estimates your catch size from a photo — honest confidence scores, live weather + barometer, private logbook. Free core app; AI estimator has a 7-day free trial. Try it: fishai.shop"

## 4. Two-week content calendar
- Day 1: Launch thread (X) + Reddit post + promo video (TikTok/Reels/Shorts)
- Day 3: "What it got wrong" post (builds trust) — show an honest miss
- Day 5: Barometer tip post ("when the pressure drops, the bite turns on — the app shows it live")
- Day 7: Logbook + spot map feature highlight (free forever — drives signups)
- Day 9: Solunar explainer post
- Day 12: "3 features I'm adding next" post
- Day 14: Recap + stats post
- Trial-angle rotation: every 3rd post mentions the 7-day trial, never spammy

## 5. Execution tracker
- [ ] Reddit: post r/Fishing (u/Shatterday420) — copy in chat
- [ ] Reddit: r/FishingForBeginners variant (D2)
- [ ] X credentials (xurl) wired → auto-post thread (D1)
- [ ] TikTok/IG/YouTube: upload F_v2 promo video (D1)
- [ ] FB groups: share post (D1)
- [ ] Weekly marketing cron (repeat calendar, rotate posts)
- [ ] SEO: sitemap.xml + Google Search Console
- [ ] Pinterest: 5 pins (fishing keywords + free-trial angle)

## 6. Rules (non-negotiable)
- No fake reviews, no astroturfing, no bought followers, no affiliate spam.
- Always disclose AI-built nature where relevant.
- **Pricing accuracy is mandatory**: "free" only for the free tier; AI estimator = "7-day free trial, $7.99/mo after, cancel anytime".
- Every claim in posts is true.

---

# DAY 1 — Launch post (r/SideProject) — paste-ready, 2026-08-17

**Title:**
> I built an AI fishing app that IDs your catch from a photo — honest confidence scores, 7-day free trial

**Body:**
> Side project I've been building for a year — fishing app (PWA, no app store) with an AI catch estimator: take a photo, it identifies the species and estimates length/weight **with a confidence score**. When it's unsure, it says so — that honesty is the whole brand.
>
> What's in it:
> • 📏 AI photo estimator (PRO, 7-day free trial, $7.99/mo)
> • 📊 Live barometric pressure + real solunar tables
> • 📍 GPS spot saving with privacy levels (real Leaflet map)
> • 🎣 Catch logbook, trophies, tackle box, beginner guides
>
> **Free forever:** everything except the AI estimator.
> **Privacy-first:** your data stays yours, 100%.
>
> Try it: **fishai.shop**
>
> Built with: React + Vite, Node/Express, Gemini vision, Leaflet, Stripe. Deployed on Vercel.
>
> I'm running a 7-day experiment to prove the funnel — feedback (good and brutal) genuinely makes the product better. What would you change first?

**Posting rules:** post 7–9pm ET; reply to every comment first hour; link once in body + once more max in comments.

---

# ASSET PACK v2 — X thread + channel copies (all UTM-tagged)

**UTM convention (instrument everything):** every link = `https://fishai.shop/?utm_source=<channel>&utm_medium=social&utm_campaign=launch_v1`
- reddit → `utm_source=reddit` · x → `utm_source=x` · fb → `utm_source=facebook` · ig → `utm_source=instagram` · yt → `utm_source=youtube` · pin → `utm_source=pinterest`

## X/Twitter launch thread (6 tweets, paste-ready)
1. 🎣 I built a fishing app with an AI that estimates your catch's size from a photo. It says exactly how confident it is. When it's unsure, it tells you. → fishai.shop
2. The idea: most "AI fishing" apps fake results. Ours is honest — confidence scores, real species ID, and it learns when you correct it. Honesty as a feature.
3. What else: live barometric pressure + real solunar tables so you know WHEN the bite turns on. GPS spot-saving with privacy levels.
4. Free forever: logbook, spots, pressure, solunar, tackle box, trophies, beginner guides. PRO (7-day free trial, $7.99/mo): the AI photo estimator.
5. Privacy-first: your data stays yours. No accounts on third-party servers, no selling data. 100% yours.
6. Try it free: https://fishai.shop/?utm_source=x&utm_medium=social&utm_campaign=launch_v1 — and if it gets a fish wrong, tell me. That's how it gets better. 🐟

## Instagram caption (Reel with promo video F_v2)
"Your catch. One photo. Honest AI. 📏 Species ID + size estimate with a REAL confidence score — no fake results. Free core app, 7-day free trial on the AI estimator. Link in bio → fishai.shop"

## Facebook group post (fishing groups)
Short version of the r/SideProject post + "free to try, AI estimator 7-day trial" + fishai.shop link (UTM facebook).

## YouTube Shorts description
"AI fishing app that IDs your catch from a photo — honest confidence scores. Try free: fishai.shop (UTM youtube). #fishing #ai #catchandrelease"

## Pinterest pins (3)
1. "AI estimates your catch size from a photo" → link
2. "When fish bite: live pressure + solunar" → link
3. "Catch logbook with GPS spots — private by default" → link

**Posting order Day 1:** r/SideProject (7-9pm ET) → X thread same evening → IG Reel next day → FB group next day.
