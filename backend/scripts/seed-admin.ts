/**
 * Seed script to create an admin user
 * Run with: npx tsx apps/api/scripts/seed-admin.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from root .env.local
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

function initFirebase() {
  if (getApps().length > 0) return getApps()[0];
  
  const serviceAccountJson = Buffer.from(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '',
    'base64',
  ).toString('utf-8');

  const serviceAccount = JSON.parse(serviceAccountJson);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

initFirebase();
const db = getFirestore();
const auth = getAuth();

const ADMIN_USER = {
  uid: 'seed_admin_1',
  email: 'admin@peernova.test',
  displayName: 'Admin User',
  role: 'admin' as const,
};

async function main() {
  console.log('🌱 Seeding Admin User...');

  try {
    try {
      await auth.getUser(ADMIN_USER.uid);
      console.log(`  ✓ Auth user ${ADMIN_USER.email} already exists`);
    } catch {
      await auth.createUser({
        uid: ADMIN_USER.uid,
        email: ADMIN_USER.email,
        displayName: ADMIN_USER.displayName,
        password: 'AdminPass123!',
        emailVerified: true,
      });
      console.log(`  ✓ Created auth user: ${ADMIN_USER.email}`);
    }

    // Set custom claims
    await auth.setCustomUserClaims(ADMIN_USER.uid, { role: ADMIN_USER.role });

    const userRef = db.collection('users').doc(ADMIN_USER.uid);
    const existing = await userRef.get();
    if (!existing.exists) {
      await userRef.set({
        id: ADMIN_USER.uid,
        email: ADMIN_USER.email,
        displayName: ADMIN_USER.displayName,
        photoURL: null,
        avatarUrl: null,
        role: ADMIN_USER.role,
        status: 'active',
        emailVerified: true,
        phoneNumber: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        deletedAt: null,
      });
      console.log(`  ✓ Created user doc: ${ADMIN_USER.displayName}`);
    } else {
      console.log(`  ✓ User doc already exists: ${ADMIN_USER.displayName}`);
    }

    console.log('\n✅ Admin Seed complete!');
    console.log('\n📋 Admin Credentials:');
    console.log('  Email:    admin@peernova.test');
    console.log('  Password: AdminPass123!');
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Admin Seed failed:', err);
    process.exit(1);
  }
}

main();
