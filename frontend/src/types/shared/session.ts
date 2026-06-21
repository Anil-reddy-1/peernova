export type SessionStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface Session {
  id: string;
  slotId: string;
  tutorId: string;
  studentId: string;
  subject: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  status: SessionStatus;
  roomId: string | null;
  paymentId: string | null;
  amount: number;
  currency: string;
  cancellationReason: string | null;
  recordingConsent: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilitySlot {
  id: string;
  tutorId: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  bookedSessionId: string | null;
  timezone: string;
  deletedAt?: Date | null;
}
