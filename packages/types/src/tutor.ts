export type SubjectLevel = 'beginner' | 'intermediate' | 'advanced';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface Subject {
  name: string;
  level: SubjectLevel;
  tags: string[];
}

export interface VerificationDocument {
  type: string;
  fileURL: string;
  uploadedAt: Date;
  status: VerificationStatus;
}

export interface TutorProfile {
  userId: string;
  displayName?: string;
  bio: string;
  subjects: Subject[];
  hourlyRate: number;
  currency: 'INR';
  languages: string[];
  rating: number;
  reviewCount: number;
  totalSessions: number;
  isVerified: boolean;
  verificationDocuments: VerificationDocument[];
  availabilityTimezone: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
