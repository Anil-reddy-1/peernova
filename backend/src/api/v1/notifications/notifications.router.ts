import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';

export const notificationsRouter = Router();

notificationsRouter.get('/', authenticate, (_req, res) => {
  res.status(200).json({ success: true, data: [], error: null, meta: null });
});

notificationsRouter.patch('/:id/read', authenticate, (_req, res) => {
  res.status(200).json({ success: true, data: { success: true }, error: null, meta: null });
});

notificationsRouter.post('/mark-all-read', authenticate, (_req, res) => {
  res.status(200).json({ success: true, data: { success: true }, error: null, meta: null });
});
