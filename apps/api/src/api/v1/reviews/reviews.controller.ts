import type { Request, Response, NextFunction } from 'express';
import { reviewsService } from './reviews.service';

export class ReviewsController {
  async createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviewerId = req.user!.uid;
      const { sessionId, tutorId, rating, comment } = req.body;

      if (!sessionId || !tutorId || rating === undefined) {
        res.status(400).json({ success: false, data: null, meta: null, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields', details: null } });
        return;
      }

      const review = await reviewsService.createReview({
        sessionId, reviewerId, tutorId, rating, comment
      });

      res.status(201).json({ success: true, data: review, meta: null, error: null });
    } catch (error) {
      next(error);
    }
  }

  async getTutorReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tutorId } = req.params as Record<string, string>;
      const page = parseInt(((req.query.page as string)) || '1', 10);
      const limit = parseInt(((req.query.limit as string)) || '20', 10);

      const result = await reviewsService.getTutorReviews(tutorId, page, limit);

      res.status(200).json({ success: true, data: result.data, meta: result.meta, error: null });
    } catch (error) {
      next(error);
    }
  }
}

export const reviewsController = new ReviewsController();
