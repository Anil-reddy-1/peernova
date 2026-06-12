import { getFirestore, getFieldValue } from '../../../lib/firebase-admin';
const FieldValue = getFieldValue();

import type { Review, PaginationMeta } from '@peer-tutoring/types';
import { NotFoundError, ConflictError } from '../../../lib/errors';

export class ReviewsService {
  private get db() {
    return getFirestore();
  }

  async createReview(data: {
    sessionId: string;
    reviewerId: string;
    tutorId: string;
    rating: number;
    comment: string | null;
  }): Promise<Review> {
    const { sessionId, reviewerId, tutorId, rating, comment } = data;

    const sessionRef = this.db.collection('sessions').doc(sessionId);
    const tutorRef = this.db.collection('tutors').doc(tutorId);
    const reviewRef = this.db.collection('reviews').doc();

    let newReview: Review;

    await this.db.runTransaction(async (t) => {
      const sessionDoc = await t.get(sessionRef);
      if (!sessionDoc.exists) throw new NotFoundError('Session', sessionId);

      const session = sessionDoc.data()!;
      if (session.status !== 'completed') {
        throw new ConflictError('Can only review completed sessions');
      }
      if (session.studentId !== reviewerId) {
        throw new ConflictError('Only the student can review this session');
      }

      // Check if review already exists for session
      const existingQuery = await t.get(this.db.collection('reviews').where('sessionId', '==', sessionId));
      if (!existingQuery.empty) {
        throw new ConflictError('Review already exists for this session');
      }

      const tutorDoc = await t.get(tutorRef);
      if (!tutorDoc.exists) throw new NotFoundError('Tutor', tutorId);

      const tutor = tutorDoc.data()!;
      const currentRating = tutor.rating || 0;
      const reviewCount = tutor.reviewCount || 0;

      const newRating = ((currentRating * reviewCount) + rating) / (reviewCount + 1);

      newReview = {
        id: reviewRef.id,
        sessionId,
        studentId: reviewerId,
        tutorId,
        rating,
        comment,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      t.set(reviewRef, newReview);
      
      t.update(tutorRef, {
        rating: parseFloat(newRating.toFixed(2)),
        reviewCount: reviewCount + 1,
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    return newReview!;
  }

  async getTutorReviews(tutorId: string, page: number, limit: number): Promise<{ data: Review[], meta: PaginationMeta }> {
    const snapshot = await this.db.collection('reviews')
      .where('tutorId', '==', tutorId)
      .orderBy('createdAt', 'desc')
      .offset((page - 1) * limit)
      .limit(limit)
      .get();

    return {
      data: snapshot.docs.map(doc => doc.data() as Review),
      meta: { page, limit, total: 0, hasMore: false }
    };
  }
}

export const reviewsService = new ReviewsService();
