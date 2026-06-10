// Test setup: mock Firebase Admin SDK and set test env vars
import { vi } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_SERVICE_ACCOUNT_JSON = Buffer.from(JSON.stringify({
  type: 'service_account',
  project_id: 'test-project',
  private_key_id: 'test-key-id',
  private_key: '-----BEGIN RSA PRIVATE KEY-----\nMIIBogIBAAJBALRiMLAHudeSA/x3hB2f+2NRkJEhAO0j+RiPtVCL/AYFuLhwRYj\ntest-key\n-----END RSA PRIVATE KEY-----\n',
  client_email: 'test@test-project.iam.gserviceaccount.com',
  client_id: '123456789',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
})).toString('base64');
process.env.RAZORPAY_KEY_ID = 'rzp_test_xxx';
process.env.RAZORPAY_KEY_SECRET = 'test_secret';

// Mock Firebase Admin
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(() => ({})),
  cert: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn(),
    createUser: vi.fn(),
    setCustomUserClaims: vi.fn(),
    revokeRefreshTokens: vi.fn(),
  })),
}));

vi.mock('firebase-admin/firestore', () => {
  const mockDoc = {
    exists: true,
    data: () => ({ id: 'test-uid', email: 'test@example.com', role: 'student' }),
    id: 'test-doc',
  };
  return {
    getFirestore: vi.fn(() => ({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(async () => mockDoc),
          set: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        })),
        where: vi.fn(() => ({
          get: vi.fn(async () => ({ docs: [], empty: true })),
        })),
      })),
    })),
    FieldValue: {
      serverTimestamp: vi.fn(() => new Date()),
      increment: vi.fn((n: number) => n),
    },
  };
});

vi.mock('firebase-admin/storage', () => ({
  getStorage: vi.fn(() => ({ bucket: vi.fn() })),
}));

vi.mock('firebase-admin/messaging', () => ({
  getMessaging: vi.fn(() => ({ send: vi.fn() })),
}));

// Mock ioredis
vi.mock('ioredis', () => {
  const RedisMock = vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    quit: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    status: 'ready',
  }));
  return { default: RedisMock };
});
