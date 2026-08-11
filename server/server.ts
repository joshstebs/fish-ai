import express from 'express';
import cors from 'cors';
import { aiRouter } from './routes/aiRoutes.js';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'FishAI Multi-Modal Server', timestamp: new Date().toISOString() });
});

// AI Routes
app.use('/api/ai', aiRouter);

app.listen(PORT, () => {
  console.log(`⚡ FishAI Backend Server listening on http://localhost:${PORT}`);
});
