export type UserRole = 'student' | 'tutor' | 'admin';

export type UserStatus = 'active' | 'suspended' | 'pending_verification' | 'deleted';

export interface BaseUser {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
