import {
  getAuth,
  getFirestore,
  getFirestoreTimestamp,
  setUserRole,
} from '../../../lib/firebase-admin';
import type { RegisterRequest, CompleteProfileRequest } from '../../../types/shared';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../../lib/errors';
import { logger } from '../../../lib/pino';

export class AuthService {
  /**
   * Register a new user.
   *
   * 1. Create Firebase Auth user with email/password
   * 2. Set custom claims { role }
   * 3. Create Firestore users/{uid} document with all BaseUser fields
   * 4. Create tutors/{uid} or students/{uid} doc based on role
   * 5. Return user profile
   */
  async register(data: RegisterRequest) {
    const { email, password, displayName, role, phoneNumber } = data;

    // Check if user already exists in Firestore by email
    const existingUsers = await getFirestore()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingUsers.empty) {
      throw new ConflictError(`User with email '${email}' already exists`);
    }

    let uid: string;

    try {
      const authPayload: any = {
        email,
        password,
        displayName,
      };
      
      if (typeof phoneNumber === 'string' && phoneNumber.trim().length > 0) {
        authPayload.phoneNumber = phoneNumber.trim();
      }

      const userRecord = await getAuth().createUser(authPayload);
      uid = userRecord.uid;
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/email-already-exists') {
        throw new ConflictError(`User with email '${email}' already exists`);
      }
      if (firebaseError.code === 'auth/phone-number-already-exists') {
        throw new ConflictError(
          `User with phone number '${phoneNumber}' already exists`,
        );
      }
      throw error;
    }

    // Set custom claims for RBAC
    await setUserRole(uid, role);

    const now = new Date();
    const timestamp = getFirestoreTimestamp();

    // Create Firestore user document
    const userDoc = {
      id: uid,
      email,
      displayName,
      photoURL: null,
      role,
      status: 'active' as const,
      emailVerified: false,
      phoneNumber: phoneNumber ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };

    const batch = getFirestore().batch();

    batch.set(getFirestore().collection('users').doc(uid), userDoc);

    // Create role-specific profile document
    if (role === 'tutor') {
      batch.set(getFirestore().collection('tutors').doc(uid), {
        userId: uid,
        bio: '',
        subjects: [],
        hourlyRate: 0,
        currency: 'INR' as const,
        languages: [],
        rating: 0,
        reviewCount: 0,
        totalSessions: 0,
        isVerified: false,
        verificationDocuments: [],
        availabilityTimezone: 'Asia/Kolkata',
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null,
      });
    } else {
      batch.set(getFirestore().collection('students').doc(uid), {
        userId: uid,
        gradeLevel: '',
        subjects: [],
        learningGoals: [],
        preferredLanguage: 'en',
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    await batch.commit();

    logger.info({ uid, email, role }, 'User registered successfully');

    return {
      id: uid,
      email,
      displayName,
      photoURL: null,
      role,
      status: 'active' as const,
      emailVerified: false,
      phoneNumber: phoneNumber ?? null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      deletedAt: null,
    };
  }

  /**
   * Complete profile for OAuth (Google) users.
   */
  async completeProfile(uid: string, data: CompleteProfileRequest) {
    const { role, phoneNumber } = data;
    let authUser;
    
    try {
      authUser = await getAuth().getUser(uid);
    } catch {
      throw new NotFoundError('User', uid);
    }
    
    const userRef = getFirestore().collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      throw new ConflictError('User profile already exists');
    }
    
    await setUserRole(uid, role);
    
    const now = new Date();
    const timestamp = getFirestoreTimestamp();
    
    if (typeof phoneNumber === 'string' && phoneNumber.trim().length > 0) {
      try {
        await getAuth().updateUser(uid, { phoneNumber: phoneNumber.trim() });
      } catch (error: unknown) {
        const firebaseError = error as { code?: string };
        if (firebaseError.code === 'auth/phone-number-already-exists') {
          throw new ConflictError(`User with phone number '${phoneNumber}' already exists`);
        }
        throw error;
      }
    }
    
    const userDoc = {
      id: uid,
      email: authUser.email ?? '',
      displayName: authUser.displayName ?? '',
      photoURL: authUser.photoURL ?? null,
      role,
      status: 'active' as const,
      emailVerified: authUser.emailVerified ?? false,
      phoneNumber: phoneNumber ?? authUser.phoneNumber ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };
    
    const batch = getFirestore().batch();
    batch.set(userRef, userDoc);
    
    if (role === 'tutor') {
      batch.set(getFirestore().collection('tutors').doc(uid), {
        userId: uid,
        bio: '',
        subjects: [],
        hourlyRate: 0,
        currency: 'INR' as const,
        languages: [],
        rating: 0,
        reviewCount: 0,
        totalSessions: 0,
        isVerified: false,
        verificationDocuments: [],
        availabilityTimezone: 'Asia/Kolkata',
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null,
      });
    } else {
      batch.set(getFirestore().collection('students').doc(uid), {
        userId: uid,
        gradeLevel: '',
        subjects: [],
        learningGoals: [],
        preferredLanguage: 'en',
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    
    await batch.commit();
    logger.info({ uid, role }, 'OAuth profile completed successfully');
    
    return {
      ...userDoc,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  /**
   * Verify a Firebase ID token and return decoded claims.
   */
  async verifyToken(token: string) {
    try {
      const decoded = await getAuth().verifyIdToken(token);
      return {
        uid: decoded.uid,
        email: decoded.email ?? null,
        emailVerified: decoded.email_verified ?? false,
        role: (decoded.role as string) ?? null,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  /**
   * Set custom claims on a user (admin only).
   */
  async setRole(uid: string, role: string) {
    // Verify the user exists in Firebase Auth
    try {
      await getAuth().getUser(uid);
    } catch {
      throw new NotFoundError('User', uid);
    }

    // Set custom claims
    await setUserRole(uid, role as 'student' | 'tutor' | 'admin');

    // Update Firestore user document
    const userRef = getFirestore().collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new NotFoundError('User', uid);
    }

    await userRef.update({
      role,
      updatedAt: getFirestoreTimestamp(),
    });

    logger.info({ uid, role }, 'User role updated by admin');

    return { uid, role };
  }

  /**
   * Get a user profile from Firestore.
   * Throws NotFoundError if user does not exist or has been soft-deleted.
   */
  async getProfile(uid: string) {
    const userSnap = await getFirestore().collection('users').doc(uid).get();

    if (!userSnap.exists) {
      throw new NotFoundError('User', uid);
    }

    const userData = userSnap.data()!;

    // Check for soft deletion
    if (userData.deletedAt !== null && userData.deletedAt !== undefined) {
      throw new NotFoundError('User', uid);
    }

    return {
      id: userData.id,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL ?? null,
      role: userData.role,
      status: userData.status,
      emailVerified: userData.emailVerified,
      phoneNumber: userData.phoneNumber ?? null,
      createdAt: userData.createdAt?.toDate?.()?.toISOString?.() ?? userData.createdAt,
      updatedAt: userData.updatedAt?.toDate?.()?.toISOString?.() ?? userData.updatedAt,
      deletedAt: null,
    };
  }

  /**
   * Soft-delete a user account.
   *
   * 1. Set deletedAt on user document
   * 2. Set status to 'deleted'
   * 3. Revoke all Firebase refresh tokens
   * 4. Log audit event
   */
  async deleteAccount(uid: string) {
    const userRef = getFirestore().collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      throw new NotFoundError('User', uid);
    }

    const userData = userSnap.data()!;

    if (userData.deletedAt !== null && userData.deletedAt !== undefined) {
      throw new NotFoundError('User', uid);
    }

    const timestamp = getFirestoreTimestamp();

    // Update user document with soft-delete fields
    await userRef.update({
      deletedAt: timestamp,
      status: 'deleted',
      updatedAt: timestamp,
    });

    // Revoke all refresh tokens for the user
    await getAuth().revokeRefreshTokens(uid);

    // Log audit event
    await getFirestore().collection('audit_logs').add({
      action: 'account_deleted',
      userId: uid,
      targetUserId: uid,
      details: {
        email: userData.email,
        previousStatus: userData.status,
      },
      createdAt: timestamp,
    });

    logger.info({ uid }, 'User account soft-deleted');

    return { uid, deleted: true };
  }
}
