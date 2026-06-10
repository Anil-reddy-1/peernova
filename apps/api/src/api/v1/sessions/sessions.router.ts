import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { sessionsController } from './sessions.controller';

export const sessionsRouter = Router();

/** @swagger
 * /api/v1/sessions:
 *   post:
 *     summary: Create/book a session
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 */
sessionsRouter.post('/', authenticate, sessionsController.bookSession);

/** @swagger
 * /api/v1/sessions:
 *   get:
 *     summary: List user's sessions
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 */
sessionsRouter.get('/', authenticate, sessionsController.listSessions);

/** @swagger
 * /api/v1/sessions/{id}:
 *   get:
 *     summary: Get session details
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 */
sessionsRouter.get('/:id', authenticate, sessionsController.getSession);

/** @swagger
 * /api/v1/sessions/{id}/status:
 *   patch:
 *     summary: Update session status
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 */
sessionsRouter.patch('/:id/status', authenticate, sessionsController.updateStatus);

/** @swagger
 * /api/v1/sessions/{id}/cancel:
 *   post:
 *     summary: Cancel a session
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 */
sessionsRouter.post('/:id/cancel', authenticate, sessionsController.cancelSession);

/** @swagger
 * /api/v1/sessions/{id}/confirm-payment:
 *   post:
 *     summary: Confirm session payment
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 */
sessionsRouter.post('/:id/confirm-payment', authenticate, sessionsController.confirmPayment);
