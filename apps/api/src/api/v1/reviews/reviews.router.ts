import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import { reviewsController } from './reviews.controller';

export const reviewsRouter = Router();

/** @swagger
 * /api/v1/reviews:
 *   post:
 *     summary: Create a review
 *     tags: [Reviews]
 *     security: [{ bearerAuth: [] }]
 */
reviewsRouter.post('/', authenticate, reviewsController.createReview);

/** @swagger
 * /api/v1/reviews/tutor/{tutorId}:
 *   get:
 *     summary: Get reviews for a tutor
 *     tags: [Reviews]
 *     security: [{ bearerAuth: [] }]
 */
reviewsRouter.get('/tutor/:tutorId', authenticate, reviewsController.getTutorReviews);

/** @swagger
 * /api/v1/reviews/{id}:
 *   get:
 *     summary: Get review by id
 *     tags: [Reviews]
 *     security: [{ bearerAuth: [] }]
 */
reviewsRouter.get('/:id', authenticate, (_req, res) => {
  res.status(501).json({ success: false, data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Will be implemented in Prompt 2', details: null }, meta: null });
});
