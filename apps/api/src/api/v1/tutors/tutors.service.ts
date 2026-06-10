import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from '../../../lib/firebase-admin';
import type { TutorProfile,  VerificationDocument, PaginationMeta, AvailabilitySlot } from '@peer-tutoring/types';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ValidationError, ConflictError } from '../../../lib/errors';


export class TutorsService {
  private get db() {
    return getFirestore();
  }



  async getTutors(params: {
    subject?: string;
    minRating?: number;
    maxPrice?: number;
    minPrice?: number;
    page: number;
    limit: number;
  }): Promise<{ data: TutorProfile[]; meta: PaginationMeta }> {
    const { subject, minRating, maxPrice, minPrice, page, limit } = params;

    // Cache removed

    let query: FirebaseFirestore.Query = this.db.collection('tutors');

    // Firestore has limitations on multiple inequality filters on different fields.
    // We will apply 'subject' (array-contains) and 'hourlyRate' (inequality) at DB level if possible,
    // but rating we might have to filter in-memory if we already use an inequality on price.
    // Since Firebase now supports multiple inequality filters, let's try to use them or fallback to memory.
    // For simplicity and safety, let's just fetch all verified tutors and filter/sort/paginate in memory
    // IF the DB query gets too complex, OR use basic queries.
    // Let's use basic queries.
    
    query = query.where('isVerified', '==', true);
    // Soft delete check
    query = query.where('deletedAt', '==', null);

    const snapshot = await query.get();
    let tutors = snapshot.docs.map(doc => doc.data() as TutorProfile);

    // Apply filters
    if (subject) {
      const lowerSubject = subject.toLowerCase();
      tutors = tutors.filter(t => t.subjects.some(s => s.name.toLowerCase().includes(lowerSubject)));
    }
    if (minRating !== undefined) {
      tutors = tutors.filter(t => t.rating >= minRating);
    }
    if (maxPrice !== undefined) {
      tutors = tutors.filter(t => t.hourlyRate <= maxPrice);
    }
    if (minPrice !== undefined) {
      tutors = tutors.filter(t => t.hourlyRate >= minPrice);
    }

    // Sort by rating DESC
    tutors.sort((a, b) => b.rating - a.rating);

    // Paginate
    const total = tutors.length;
    const startIndex = (page - 1) * limit;
    const paginatedTutors = tutors.slice(startIndex, startIndex + limit);

    const result = {
      data: paginatedTutors,
      meta: {
        page,
        limit,
        total,
        hasMore: startIndex + limit < total,
      },
    };

    return result;
  }

  async getTutorById(tutorId: string): Promise<TutorProfile> {
    const doc = await this.db.collection('tutors').doc(tutorId).get();
    if (!doc.exists) {
      throw new NotFoundError('Tutor', tutorId);
    }
    const tutor = doc.data() as TutorProfile;
    if (tutor.deletedAt) {
      throw new NotFoundError('Tutor', tutorId);
    }
    return tutor;
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
      .where('startTime', '>=', now)
      .where('isBooked', '==', false)
      .orderBy('startTime', 'asc')
      .get();

    return snapshot.docs.map(doc => doc.data() as AvailabilitySlot);
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

    // Check for overlaps
    const existingSlots = await this.db.collection('availability')
      .where('tutorId', '==', tutorId)
      .where('startTime', '<', slotData.endTime)
      .get();

    const hasOverlap = existingSlots.docs.some(doc => {
      const existing = doc.data() as AvailabilitySlot;
      // Because we queried startTime < new.endTime, we just need to check if existing.endTime > new.startTime
      // Note: Firestore returns Timestamps which need to be converted to dates
      const existingEnd = (existing.endTime as any).toDate ? (existing.endTime as any).toDate() : new Date(existing.endTime);
      return existingEnd > slotData.startTime && !existing.deletedAt;
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
