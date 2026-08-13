import express from 'express';
import cors from 'cors';
import { aiRouter } from './routes/aiRoutes.js';

// Shared Express app — used by:
//  - server/server.ts (local dev: app.listen)
//  - api/index.ts     (Vercel: exported as a serverless function)
export const app = express();

app.use(cors());
// Client-side image compression (FishDimensionEstimator) keeps payloads well
// under 1MB; 15mb is generous headroom (Vercel caps requests at 4.5MB anyway).
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'FishAI Multi-Modal Server', timestamp: new Date().toISOString() });
});

// AI Routes
app.use('/api/ai', aiRouter);
