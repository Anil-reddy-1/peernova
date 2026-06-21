import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getAuth as getFirebaseAuth } from 'firebase-admin/auth';
import type { Auth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore as getFirebaseFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { getStorage as getFirebaseStorage } from 'firebase-admin/storage';
import type { Storage } from 'firebase-admin/storage';
import { getDatabase as getFirebaseDatabase } from 'firebase-admin/database';
import type { Database } from 'firebase-admin/database';
import { getMessaging as getFirebaseMessaging } from 'firebase-admin/messaging';
import type { Messaging } from 'firebase-admin/messaging';
import type { UserRole } from '../types/shared';
import { logger } from './pino';
import { ServiceUnavailableError } from './errors';

// Force native DNS resolution for gRPC to fix timeout issues on Node 18+ Windows
process.env.GRPC_DNS_RESOLVER = 'native';

let firebaseApp: App | null = null;

export function initializeFirebase(): App | null {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
    return firebaseApp;
  }

  try {
    const serviceAccountJson = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '',
      'base64',
    ).toString('utf-8');

    if (!serviceAccountJson) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Firebase credentials not configured. Running without Firebase.');
        return null;
      }
      throw new Error('Firebase credentials are required in production');
    }

    const serviceAccount = JSON.parse(serviceAccountJson) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };

    // Ensure private_key has real newlines (not escaped \\n)
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    firebaseApp = initializeApp({
      credential: cert(serviceAccount as ServiceAccount),
      projectId: serviceAccount.project_id,
    });

    logger.info('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to initialize Firebase Admin SDK');
    throw error;
  }
}

export function getFirestore(): Firestore {
  if (!firebaseApp) {
    initializeFirebase();
  }
  if (!firebaseApp) {
    throw new ServiceUnavailableError('Firebase Admin SDK is not initialized.');
  }
  return getFirebaseFirestore(firebaseApp);
}

export function getAuth(): Auth {
  if (!firebaseApp) {
    initializeFirebase();
  }
  if (!firebaseApp) {
    throw new ServiceUnavailableError('Firebase Admin SDK is not initialized.');
  }
  return getFirebaseAuth(firebaseApp);
}

export function getStorage(): Storage {
  if (!firebaseApp) {
    initializeFirebase();
  }
  if (!firebaseApp) {
    throw new ServiceUnavailableError('Firebase Admin SDK is not initialized.');
  }
  return getFirebaseStorage(firebaseApp);
}

export function getDatabase(): Database {
  if (!firebaseApp) {
    initializeFirebase();
  }
  if (!firebaseApp) {
    throw new ServiceUnavailableError('Firebase Admin SDK is not initialized.');
  }
  return getFirebaseDatabase(firebaseApp);
}

export function getMessaging(): Messaging {
  if (!firebaseApp) {
    initializeFirebase();
  }
  if (!firebaseApp) {
    throw new ServiceUnavailableError('Firebase Admin SDK is not initialized.');
  }
  return getFirebaseMessaging(firebaseApp);
}

export function getFieldValue(): typeof FieldValue {
  return FieldValue;
}

export { firebaseApp as adminApp };

// Compatibility exports for existing code
export async function verifyIdToken(
  token: string,
): Promise<DecodedIdToken & { role?: UserRole }> {
  const auth = getAuth();
  const decoded = await auth.verifyIdToken(token);
  const role = (decoded.role as UserRole | undefined) ?? undefined;
  return { ...decoded, role };
}

export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  const auth = getAuth();
  await auth.setCustomUserClaims(uid, { role });
  logger.info({ uid, role }, 'User role updated');
}

export function getFirestoreTimestamp(): FieldValue {
  return FieldValue.serverTimestamp();
}
