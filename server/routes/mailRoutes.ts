import { Router } from 'express';

// Public mail testing was an unauthenticated email relay. Remove the Resend
// integration from this route entirely so it cannot send mail or incur charges.
export const mailRouter = Router();

mailRouter.post('/test', (_req, res) => {
  res.status(410).json({ error: 'Public email testing is disabled.', code: 'MAIL_TEST_DISABLED' });
});
