import { getFirestore, getStorage, getFieldValue } from '../../../lib/firebase-admin';

const FieldValue = getFieldValue();

import type { TutorProfile,  VerificationDocument, PaginationMeta, AvailabilitySlot } from '@peer-tutoring/types';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ValidationError, ConflictError } from '../../../lib/errors';


export class TutorsService {
  private get db() {
    return getFirestore();
  }



  async getTutors(params: {
    subject?: string;
    search?: string;
    minRating?: number;
    maxPrice?: number;
    minPrice?: number;
    page: number;
    limit: number;
  }): Promise<{ data: (TutorProfile & { displayName: string; photoURL: string | null })[]; meta: PaginationMeta }> {
    const { subject, search, minRating, maxPrice, minPrice, page, limit } = params;

    const snapshot = await this.db.collection('tutors').get();
    let tutors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TutorProfile & { id: string }));

    // Soft delete check
    tutors = tutors.filter(t => !t.deletedAt);

    // Enrich with user displayName and photoURL from the users collection
    const userIds = tutors.map(t => t.userId);
    const userDocs = await Promise.all(
      userIds.map(uid => this.db.collection('users').doc(uid).get())
    );
    const userMap = new Map<string, { displayName: string; photoURL: string | null }>();
    userDocs.forEach(doc => {
      if (doc.exists) {
        const d = doc.data()!;
        userMap.set(doc.id, { displayName: d.displayName || '', photoURL: d.photoURL || null });
      }
    });

    type EnrichedTutor = TutorProfile & { id: string; displayName: string; photoURL: string | null };
    let enriched: EnrichedTutor[] = tutors.map(t => ({
      ...t,
      displayName: userMap.get(t.userId)?.displayName || '',
      photoURL: userMap.get(t.userId)?.photoURL || null,
    }));

    // Apply filters
    if (search) {
      const lower = search.toLowerCase();
      enriched = enriched.filter(t =>
        t.displayName.toLowerCase().includes(lower) ||
        t.subjects.some(s => s.name.toLowerCase().includes(lower))
      );
    }
    if (subject) {
      const lowerSubject = subject.toLowerCase();
      enriched = enriched.filter(t => t.subjects.some(s => s.name.toLowerCase().includes(lowerSubject)));
    }
    if (minRating !== undefined) {
      enriched = enriched.filter(t => t.rating >= minRating);
    }
    if (maxPrice !== undefined) {
      enriched = enriched.filter(t => t.hourlyRate <= maxPrice);
    }
    if (minPrice !== undefined) {
      enriched = enriched.filter(t => t.hourlyRate >= minPrice);
    }

    // Sort by rating DESC
    enriched.sort((a, b) => b.rating - a.rating);

    // Paginate
    const total = enriched.length;
    const startIndex = (page - 1) * limit;
    const paginatedTutors = enriched.slice(startIndex, startIndex + limit);

    return {
      data: paginatedTutors,
      meta: { page, limit, total, hasMore: startIndex + limit < total },
    };
  }

  async getTutorById(tutorId: string): Promise<TutorProfile & { displayName: string; photoURL: string | null }> {
    const doc = await this.db.collection('tutors').doc(tutorId).get();
    if (!doc.exists) {
      throw new NotFoundError('Tutor', tutorId);
    }
    const tutor = doc.data() as TutorProfile;
    if (tutor.deletedAt) {
      throw new NotFoundError('Tutor', tutorId);
    }

    // Enrich with displayName and photoURL from users collection
    const userDoc = await this.db.collection('users').doc(tutor.userId).get();
    const userData = userDoc.exists ? userDoc.data()! : {};

    return {
      ...tutor,
      id: tutorId,
      displayName: (userData as any).displayName || '',
      photoURL: (userData as any).photoURL || null,
    };
  }

  async updateProfile(tutorId: string, data: Partial<TutorProfile>): Promise<TutorProfile> {
    const docRef = this.db.collection('tutors').doc(tutorId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundError('Tutor', tutorId);
    }

    const updateData: any = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.update(updateData);

    // Cache invalidation removed

    const updatedDoc = await docRef.get();
    return updatedDoc.data() as TutorProfile;
  }

  async getAvailability(tutorId: string): Promise<AvailabilitySlot[]> {
    const now = new Date();
    const snapshot = await this.db.collection('availability')
      .where('tutorId', '==', tutorId)
      .orderBy('startTime', 'asc')
      .get();

    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        // Handle Firestore Timestamp objects
        const startTime = data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime);
        const endTime = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime);
        return { ...data, id: doc.id, startTime, endTime } as AvailabilitySlot;
      })
      .filter(slot => slot.startTime >= now && !slot.deletedAt); // Filter past and deleted slots in-memory
  }

  async createAvailability(tutorId: string, slotData: { startTime: Date, endTime: Date, timezone: string }): Promise<AvailabilitySlot> {
    const now = new Date();
    if (slotData.startTime <= now) {
      throw new ValidationError({ startTime: ['Start time must be in the future'] });
    }

    const duration = slotData.endTime.getTime() - slotData.startTime.getTime();
    if (duration <= 0 || duration > 2 * 60 * 60 * 1000) {
      throw new ValidationError({ endTime: ['Slot must be between 0 and 2 hours'] });
    }

    // Check for overlaps - fetch all tutor slots and filter in memory to avoid composite index requirement
    const existingSlots = await this.db.collection('availability')
      .where('tutorId', '==', tutorId)
      .get();

    const hasOverlap = existingSlots.docs.some(doc => {
      const existing = doc.data() as AvailabilitySlot;
      const existingStart = (existing.startTime as any).toDate ? (existing.startTime as any).toDate() : new Date(existing.startTime);
      const existingEnd = (existing.endTime as any).toDate ? (existing.endTime as any).toDate() : new Date(existing.endTime);
      return existingEnd > slotData.startTime && existingStart < slotData.endTime && !existing.deletedAt;
    });

    if (hasOverlap) {
      throw new ConflictError('Availability slot overlaps with an existing slot');
    }

    const slotRef = this.db.collection('availability').doc();
    const newSlot: AvailabilitySlot & { deletedAt: null | Date } = {
      id: slotRef.id,
      tutorId,
      startTime: slotData.startTime,
      endTime: slotData.endTime,
      isBooked: false,
      bookedSessionId: null,
      timezone: slotData.timezone,
      deletedAt: null
    };

    await slotRef.set(newSlot);
    return newSlot;
  }

  async deleteAvailability(tutorId: string, slotId: string): Promise<void> {
    const slotRef = this.db.collection('availability').doc(slotId);
    const slot = await slotRef.get();

    if (!slot.exists) {
      throw new NotFoundError('AvailabilitySlot', slotId);
    }

    const data = slot.data() as AvailabilitySlot;
    if (data.tutorId !== tutorId) {
      throw new ConflictError('Slot belongs to another tutor');
    }

    if (data.isBooked) {
      throw new ConflictError('Cannot delete a booked slot');
    }

    await slotRef.update({ deletedAt: FieldValue.serverTimestamp() });
  }

  async uploadVerificationDocument(tutorId: string, fileBuffer: Buffer, mimeType: string, documentType: string): Promise<VerificationDocument> {
    const tutorRef = this.db.collection('tutors').doc(tutorId);
    const tutorDoc = await tutorRef.get();

    if (!tutorDoc.exists) {
      throw new NotFoundError('Tutor', tutorId);
    }

    const storage = getStorage();
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error('FIREBASE_STORAGE_BUCKET environment variable is not configured.');
    }
    const bucket = storage.bucket(bucketName);

    // Determine extension
    let ext = 'pdf';
    if (mimeType === 'image/jpeg') ext = 'jpg';
    if (mimeType === 'image/png') ext = 'png';

    const fileUuid = uuidv4();
    const destinationPath = `verification/${tutorId}/${fileUuid}.${ext}`;
    const file = bucket.file(destinationPath);

    await file.save(fileBuffer, {
      metadata: { contentType: mimeType },
      public: true // or use signed URLs depending on privacy needs. For now, we'll store public or rely on standard bucket rules.
    });

    // Make the file public to get a direct URL (or generate signed URL)
    await file.makePublic();
    const fileURL = `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;

    const newDoc: VerificationDocument = {
      type: documentType,
      fileURL,
      uploadedAt: new Date(),
      status: 'pending'
    };

    // Append to verificationDocuments array
    await tutorRef.update({
      verificationDocuments: FieldValue.arrayUnion(newDoc),
      updatedAt: FieldValue.serverTimestamp()
    });

    return newDoc;
  }
}

export const tutorsService = new TutorsService();
