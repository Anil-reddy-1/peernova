import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { 
  Session, 
  AvailabilitySlot, 
  Payment, 
  TutorProfile,
  PaginationMeta 
} from '@peer-tutoring/types';
import { NotFoundError, ValidationError, ConflictError } from '../../../lib/errors';


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

      const tutorDoc = await t.get(tutorRef);
      if (!tutorDoc.exists) {
        throw new NotFoundError('Tutor', tutorId);
      }
      
      const tutor = tutorDoc.data() as TutorProfile;

      startTime = (slot.startTime as any).toDate ? (slot.startTime as any).toDate() : new Date(slot.startTime);
      endTime = (slot.endTime as any).toDate ? (slot.endTime as any).toDate() : new Date(slot.endTime);
      durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      
      const hourlyRate = tutor.hourlyRate || 0;
      sessionAmount = Math.round((durationMinutes / 60) * hourlyRate);

      t.update(slotRef, {
        isBooked: true,
        bookedSessionId: sessionRef.id,
        updatedAt: FieldValue.serverTimestamp()
      });

      const sessionData: Session & { deletedAt: Date | null } = {
        id: sessionRef.id,
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
      currency: 'INR'
    };
  }

  async confirmPayment(sessionId: string, paymentId: string): Promise<void> {
    const sessionRef = this.db.collection('sessions').doc(sessionId);
    const paymentRef = this.db.collection('payments').doc(paymentId);

    await this.db.runTransaction(async (t) => {
      const sessionDoc = await t.get(sessionRef);
      if (!sessionDoc.exists) throw new NotFoundError('Session', sessionId);

      const paymentDoc = await t.get(paymentRef);
      if (!paymentDoc.exists) throw new NotFoundError('Payment', paymentId);

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

      if (role === 'student' && session.studentId !== userId) throw new ConflictError('Unauthorized');
      if (role === 'tutor' && session.tutorId !== userId) throw new ConflictError('Unauthorized');
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
    if (session.tutorId !== tutorId) throw new ConflictError('Unauthorized');

    await sessionRef.update({
      status,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  async listUserSessions(userId: string, role: string, page: number, limit: number): Promise<{ data: Session[], meta: PaginationMeta }> {
    const field = role === 'tutor' ? 'tutorId' : 'studentId';
    
    const snapshot = await this.db.collection('sessions')
      .where(field, '==', userId)
      .orderBy('startTime', 'desc')
      .offset((page - 1) * limit)
      .limit(limit)
      .get();

    const countSnapshot = await this.db.collection('sessions').where(field, '==', userId).count().get();
    const total = countSnapshot.data().count;

    return {
      data: snapshot.docs.map(doc => doc.data() as Session),
      meta: {
        page, limit, total, hasMore: (page * limit) < total
      }
    };
  }

  async getSession(sessionId: string, userId: string, role: string): Promise<Session> {
    const sessionDoc = await this.db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) throw new NotFoundError('Session', sessionId);

    const session = sessionDoc.data() as Session;
    if (role === 'tutor' && session.tutorId !== userId) throw new ConflictError('Unauthorized');
    if (role === 'student' && session.studentId !== userId) throw new ConflictError('Unauthorized');

    return session;
  }
}

export const sessionsService = new SessionsService();
