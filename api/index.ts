import { app } from '../server/app.js';

// Vercel serverless entry point. Vercel detects the Express app exported here
// and serves it as a single lambda at /api/* (see vercel.json rewrites).
export default app;
