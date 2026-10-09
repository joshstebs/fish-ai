import { app } from './app.js';

// Local dev entry point only. On Vercel, api/index.ts exports `app` as a
// serverless function and nothing listens on a port.
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`⚡ FishAI Backend Server listening on http://localhost:${PORT}`);
});
