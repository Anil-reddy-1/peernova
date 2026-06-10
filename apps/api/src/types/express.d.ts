import type { DecodedIdToken } from 'firebase-admin/auth';
import type { UserRole } from '@peer-tutoring/types';

interface AuthUser {
  uid: string;
  name?: string;
  email?: string;
  picture?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  role?: string;
  customClaims?: DecodedIdToken;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId: string;
    }
  }
}

export {};
