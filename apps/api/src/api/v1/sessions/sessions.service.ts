import { getFirestore, getFieldValue } from '../../../lib/firebase-admin';
const FieldValue = getFieldValue();

import type { 
  Session, 
  AvailabilitySlot, 
  Payment, 
  TutorProfile,
  PaginationMeta 
} from '@peer-tutoring/types';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../../../lib/errors';


export class SessionsService {
  private get db() {
    return getFirestore();
  }

  async bookSession(data: {
    slotId: string;
    tutorId: string;
    studentId: string;
    subject: string;
    recordingConsent: boolean;
  }): Promise<{ session: Session; orderId: string; amount: number; currency: string }> {
    const { slotId, tutorId, studentId, subject, recordingConsent } = data;

    const slotRef = this.db.collection('availability').doc(slotId);
    const tutorRef = this.db.collection('tutors').doc(tutorId);
    const sessionRef = this.db.collection('sessions').doc();
    const paymentRef = this.db.collection('payments').doc();

    let sessionAmount = 0;
    let sessionCurrency = 'INR';
    let durationMinutes = 0;
    let startTime: Date;
    let endTime: Date;
    const mockOrderId = `mock_order_${Date.now()}`;

    await this.db.runTransaction(async (t) => {
      const slotDoc = await t.get(slotRef);
      if (!slotDoc.exists) {
        throw new NotFoundError('AvailabilitySlot', slotId);
      }

      const slot = slotDoc.data() as AvailabilitySlot;
      if (slot.isBooked || slot.deletedAt) {
        throw new ConflictError('This slot is already booked or deleted.');
      }
      if (slot.tutorId !== tutorId) {
        throw new ValidationError({ tutorId: ['Slot does not belong to this tutor.'] });
      }
      if (studentId === tutorId) {
        throw new ConflictError('Cannot book your own profile.');
      }

      const tutorDoc = await t.get(tutorRef);
      if (!tutorDoc.exists) {
        throw new NotFoundError('Tutor', tutorId);
      }
      
      const tutor = tutorDoc.data() as TutorProfile;

      startTime = (slot.startTime as any).toDate ? (slot.startTime as any).toDate() : new Date(slot.startTime);
      endTime = (slot.endTime as any).toDate ? (slot.endTime as any).toDate() : new Date(slot.endTime);
      
      if (startTime.getTime() <= Date.now()) {
        throw new ConflictError('Cannot book a past slot');
      }
      if (endTime.getTime() <= startTime.getTime()) {
        throw new ValidationError({ endTime: ['End time must be after start time'] });
      }
      
      durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      
      const hourlyRate = tutor.hourlyRate || 0;
      sessionAmount = Math.round((durationMinutes / 60) * hourlyRate);
      sessionCurrency = tutor.currency || 'INR';

      t.update(slotRef, {
        isBooked: true,
        bookedSessionId: sessionRef.id,
        updatedAt: FieldValue.serverTimestamp()
      });

      const sessionData: Session & { deletedAt: Date | null } = {
        id: sessionRef.id,
        slotId,
        tutorId,
        studentId,
        subject,
        startTime,
        endTime,
        durationMinutes,
        status: 'pending',
        roomId: null,
        paymentId: paymentRef.id,
        amount: sessionAmount,
        currency: tutor.currency || 'INR',
        cancellationReason: null,
        recordingConsent,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };
      t.set(sessionRef, sessionData);

      const paymentData: Payment = {
        id: paymentRef.id,
        sessionId: sessionRef.id,
        studentId,
        tutorId,
        razorpayOrderId: mockOrderId,
        razorpayPaymentId: null,
        razorpaySignature: null,
        amount: sessionAmount,
        currency: tutor.currency || 'INR',
        status: 'created',
        idempotencyKey: sessionRef.id,
        webhookProcessedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      t.set(paymentRef, paymentData);
    });

    const sessionDoc = await sessionRef.get();

    return {
      session: sessionDoc.data() as Session,
      orderId: mockOrderId,
      amount: sessionAmount,
      currency: sessionCurrency
    };
  }

  async confirmPayment(sessionId: string, paymentId: string, studentId: string): Promise<void> {
    const sessionRef = this.db.collection('sessions').doc(sessionId);
    const paymentRef = this.db.collection('payments').doc(paymentId);

    await this.db.runTransaction(async (t) => {
      const sessionDoc = await t.get(sessionRef);
      if (!sessionDoc.exists) throw new NotFoundError('Session', sessionId);

      const session = sessionDoc.data() as Session;
      if (session.studentId !== studentId) throw new ForbiddenError('Unauthorized');

      const paymentDoc = await t.get(paymentRef);
      if (!paymentDoc.exists) throw new NotFoundError('Payment', paymentId);

      const payment = paymentDoc.data() as Payment;
      if (payment.sessionId !== sessionId) throw new ConflictError('Payment does not belong to this session');

      t.update(paymentRef, {
        status: 'captured',
        updatedAt: FieldValue.serverTimestamp()
      });

      t.update(sessionRef, {
        status: 'confirmed',
        updatedAt: FieldValue.serverTimestamp()
      });
    });
  }

  async cancelSession(sessionId: string, userId: string, role: string, reason: string): Promise<void> {
    const sessionRef = this.db.collection('sessions').doc(sessionId);

    await this.db.runTransaction(async (t) => {
      const sessionDoc = await t.get(sessionRef);
      if (!sessionDoc.exists) throw new NotFoundError('Session', sessionId);

      const session = sessionDoc.data() as Session;

      if (role === 'student' && session.studentId !== userId) throw new ForbiddenError('Unauthorized');
      if (role === 'tutor' && session.tutorId !== userId) throw new ForbiddenError('Unauthorized');
      if (!['pending', 'confirmed'].includes(session.status)) {
        throw new ConflictError(`Cannot cancel session in ${session.status} status`);
      }

      const startTime = (session.startTime as any).toDate ? (session.startTime as any).toDate() : new Date(session.startTime);
      const hoursUntilStart = (startTime.getTime() - Date.now()) / (1000 * 60 * 60);

      if (hoursUntilStart < 2) {
        throw new ConflictError('Cannot cancel within 2 hours of session start time');
      }

      t.update(sessionRef, {
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: FieldValue.serverTimestamp()
      });

      if (session.slotId) {
        const slotRef = this.db.collection('availability').doc(session.slotId);
        t.update(slotRef, {
          isBooked: false,
          bookedSessionId: null,
          updatedAt: FieldValue.serverTimestamp()
        });
      } else {
        const availabilityQuery = await t.get(
          this.db.collection('availability').where('bookedSessionId', '==', sessionId)
        );
        if (!availabilityQuery.empty) {
          t.update(availabilityQuery.docs[0].ref, {
            isBooked: false,
            bookedSessionId: null,
            updatedAt: FieldValue.serverTimestamp()
          });
        }
      }

      if (session.status === 'confirmed' && session.paymentId) {
        const paymentRef = this.db.collection('payments').doc(session.paymentId);
        t.update(paymentRef, {
          status: 'refunded',
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    });
  }

  async updateSessionStatus(sessionId: string, tutorId: string, status: 'in_progress' | 'completed'): Promise<void> {
    const sessionRef = this.db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) throw new NotFoundError('Session', sessionId);

    const session = sessionDoc.data() as Session;
    if (session.tutorId !== tutorId) throw new ForbiddenError('Unauthorized');

    if (status === 'in_progress' && session.status !== 'confirmed') {
      throw new ConflictError('Can only start a confirmed session');
    }
    if (status === 'completed' && session.status !== 'in_progress') {
      throw new ConflictError('Can only complete an in-progress session');
    }

    await sessionRef.update({
      status,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  async listUserSessions(userId: string, role: string, page: number, limit: number): Promise<{ data: Session[], meta: PaginationMeta }> {
    const field = role === 'tutor' ? 'tutorId' : 'studentId';

    // Fetch all sessions for this user - sort in memory to avoid composite index requirement
    const snapshot = await this.db.collection('sessions')
      .where(field, '==', userId)
      .get();

    const allSessions = snapshot.docs.map(doc => {
      const data = doc.data();
      // Deserialize Firestore Timestamps so they can be JSON-serialized
      const startTime = data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime);
      const endTime = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime);
      return {
        ...data,
        id: doc.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as unknown as Session;
    });

    // Sort by startTime descending
    allSessions.sort((a, b) =>
      new Date(b.startTime as any).getTime() - new Date(a.startTime as any).getTime()
    );

    const total = allSessions.length;
    const startIndex = (page - 1) * limit;
    const paginatedSessions = allSessions.slice(startIndex, startIndex + limit);

    return {
      data: paginatedSessions,
      meta: {
        page, limit, total, hasMore: startIndex + limit < total
      }
    };
  }

  async getSession(sessionId: string, userId: string, role: string): Promise<Session> {
    const sessionDoc = await this.db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) throw new NotFoundError('Session', sessionId);

    const session = sessionDoc.data() as Session;
    if (role === 'tutor' && session.tutorId !== userId) throw new ForbiddenError('Unauthorized');
    if (role === 'student' && session.studentId !== userId) throw new ForbiddenError('Unauthorized');

    return session;
  }
}

export const sessionsService = new SessionsService();
