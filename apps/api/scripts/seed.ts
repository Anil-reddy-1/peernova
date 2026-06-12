/**
 * Seed script to populate Firestore with realistic test data.
 * Run with: npx tsx apps/api/scripts/seed.ts
 * 
 * Creates:
 * - 2 tutors (with verified profiles, availability slots, sessions)
 * - 2 students
 * - Sessions in various states
 * - Chat rooms with messages
 * - Reviews
 * - Notifications
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from root .env.local
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

// Initialize Firebase Admin
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

// Helper to add days/hours to a date
function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

const now = new Date();

// ── Test Users ────────────────────────────────────────────────────────────────
const USERS = [
  {
    uid: 'seed_tutor_1',
    email: 'arjun.tutor@peernova.test',
    displayName: 'Arjun Sharma',
    role: 'tutor' as const,
    phoneNumber: null,
  },
  {
    uid: 'seed_tutor_2',
    email: 'priya.tutor@peernova.test',
    displayName: 'Priya Mehta',
    role: 'tutor' as const,
    phoneNumber: null,
  },
  {
    uid: 'seed_student_1',
    email: 'rahul.student@peernova.test',
    displayName: 'Rahul Verma',
    role: 'student' as const,
    phoneNumber: null,
  },
  {
    uid: 'seed_student_2',
    email: 'ananya.student@peernova.test',
    displayName: 'Ananya Singh',
    role: 'student' as const,
    phoneNumber: null,
  },
];

// ── Seed functions ────────────────────────────────────────────────────────────

async function createFirebaseAuthUser(user: typeof USERS[0]) {
  try {
    await auth.getUser(user.uid);
    console.log(`  ✓ Auth user ${user.email} already exists`);
  } catch {
    try {
      await auth.createUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        password: 'TestPass123!',
        emailVerified: true,
      });
      console.log(`  ✓ Created auth user: ${user.email}`);
    } catch (err: any) {
      console.log(`  ⚠ Could not create auth user ${user.email}: ${err.message}`);
    }
  }
  // Set custom claims
  try {
    await auth.setCustomUserClaims(user.uid, { role: user.role });
  } catch {}
}

async function seedUsers() {
  console.log('\n📦 Seeding users...');
  const batch = db.batch();

  for (const user of USERS) {
    await createFirebaseAuthUser(user);

    const userRef = db.collection('users').doc(user.uid);
    const existing = await userRef.get();
    if (!existing.exists) {
      batch.set(userRef, {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: null,
        avatarUrl: null,
        role: user.role,
        status: 'active',
        emailVerified: true,
        phoneNumber: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        deletedAt: null,
      });
      console.log(`  ✓ Queued user doc: ${user.displayName}`);
    } else {
      console.log(`  ✓ User doc already exists: ${user.displayName}`);
    }
  }

  await batch.commit();
}

async function seedTutorProfiles() {
  console.log('\n📦 Seeding tutor profiles...');

  const tutor1Ref = db.collection('tutors').doc('seed_tutor_1');
  const existing1 = await tutor1Ref.get();
  if (!existing1.exists) {
    await tutor1Ref.set({
      id: 'seed_tutor_1',
      userId: 'seed_tutor_1',
      displayName: 'Arjun Sharma',
      bio: 'IIT Delhi graduate with 5+ years of experience teaching Mathematics and Physics. Specialized in JEE/NEET preparation. I believe in building strong fundamentals and problem-solving skills.',
      subjects: [
        { name: 'Mathematics', level: 'advanced', tags: ['Calculus', 'Algebra', 'JEE'] },
        { name: 'Physics', level: 'advanced', tags: ['Mechanics', 'Optics', 'JEE'] },
      ],
      hourlyRate: 1500,
      currency: 'INR',
      languages: ['Hindi', 'English'],
      rating: 4.8,
      reviewCount: 24,
      totalSessions: 156,
      isVerified: true,
      verificationDocuments: [],
      availabilityTimezone: 'Asia/Kolkata',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      deletedAt: null,
    });
    console.log('  ✓ Created tutor: Arjun Sharma');
  } else {
    console.log('  ✓ Tutor Arjun Sharma already exists');
  }

  const tutor2Ref = db.collection('tutors').doc('seed_tutor_2');
  const existing2 = await tutor2Ref.get();
  if (!existing2.exists) {
    await tutor2Ref.set({
      id: 'seed_tutor_2',
      userId: 'seed_tutor_2',
      displayName: 'Priya Mehta',
      bio: 'BITS Pilani alumna and software engineer. I teach Python, Data Structures & Algorithms, and Web Development. Helped 50+ students crack tech interviews at top companies.',
      subjects: [
        { name: 'Python', level: 'intermediate', tags: ['Data Structures', 'OOP', 'Automation'] },
        { name: 'Web Development', level: 'intermediate', tags: ['HTML', 'CSS', 'JavaScript', 'React'] },
        { name: 'Data Structures & Algorithms', level: 'advanced', tags: ['LeetCode', 'Interview Prep'] },
      ],
      hourlyRate: 1200,
      currency: 'INR',
      languages: ['English', 'Hindi', 'Gujarati'],
      rating: 4.9,
      reviewCount: 38,
      totalSessions: 203,
      isVerified: true,
      verificationDocuments: [],
      availabilityTimezone: 'Asia/Kolkata',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      deletedAt: null,
    });
    console.log('  ✓ Created tutor: Priya Mehta');
  } else {
    console.log('  ✓ Tutor Priya Mehta already exists');
  }

  // Student profiles
  for (const uid of ['seed_student_1', 'seed_student_2']) {
    const studentRef = db.collection('students').doc(uid);
    const existingStudent = await studentRef.get();
    if (!existingStudent.exists) {
      await studentRef.set({
        userId: uid,
        gradeLevel: 'Grade 12',
        subjects: ['Mathematics', 'Physics'],
        learningGoals: ['Crack JEE Advanced', 'Improve problem solving'],
        preferredLanguage: 'en',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`  ✓ Created student profile: ${uid}`);
    }
  }
}

async function seedAvailabilitySlots() {
  console.log('\n📦 Seeding availability slots...');

  const slots = [
    // Arjun's slots - next 7 days
    ...Array.from({ length: 7 }, (_, i) => ({
      tutorId: 'seed_tutor_1',
      startTime: addHours(addDays(new Date(now.setHours(10, 0, 0, 0)), i + 1), 0),
      endTime: addHours(addDays(new Date(now.setHours(10, 0, 0, 0)), i + 1), 1),
    })),
    ...Array.from({ length: 7 }, (_, i) => ({
      tutorId: 'seed_tutor_1',
      startTime: addHours(addDays(new Date(new Date().setHours(15, 0, 0, 0)), i + 1), 0),
      endTime: addHours(addDays(new Date(new Date().setHours(15, 0, 0, 0)), i + 1), 1),
    })),
    // Priya's slots
    ...Array.from({ length: 7 }, (_, i) => ({
      tutorId: 'seed_tutor_2',
      startTime: addHours(addDays(new Date(new Date().setHours(11, 0, 0, 0)), i + 1), 0),
      endTime: addHours(addDays(new Date(new Date().setHours(11, 0, 0, 0)), i + 1), 1.5),
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      tutorId: 'seed_tutor_2',
      startTime: addHours(addDays(new Date(new Date().setHours(18, 0, 0, 0)), i + 1), 0),
      endTime: addHours(addDays(new Date(new Date().setHours(18, 0, 0, 0)), i + 1), 1),
    })),
  ];

  let count = 0;
  for (const slot of slots) {
    const slotRef = db.collection('availability').doc();
    await slotRef.set({
      id: slotRef.id,
      tutorId: slot.tutorId,
      startTime: Timestamp.fromDate(slot.startTime),
      endTime: Timestamp.fromDate(slot.endTime),
      isBooked: false,
      bookedSessionId: null,
      timezone: 'Asia/Kolkata',
      deletedAt: null,
    });
    count++;
  }
  console.log(`  ✓ Created ${count} availability slots`);
}

async function seedSessions() {
  console.log('\n📦 Seeding sessions...');

  const sessions = [
    // Upcoming confirmed session (student 1 with tutor 1)
    {
      id: 'seed_session_1',
      slotId: 'seed_slot_1',
      tutorId: 'seed_tutor_1',
      studentId: 'seed_student_1',
      subject: 'Mathematics - JEE Calculus',
      startTime: Timestamp.fromDate(addDays(new Date(), 2)),
      endTime: Timestamp.fromDate(addHours(addDays(new Date(), 2), 1)),
      durationMinutes: 60,
      status: 'confirmed',
      roomId: null,
      paymentId: 'seed_payment_1',
      amount: 1500,
      currency: 'INR',
      cancellationReason: null,
      recordingConsent: true,
      notes: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      deletedAt: null,
    },
    // Upcoming pending session (student 2 with tutor 2)
    {
      id: 'seed_session_2',
      slotId: 'seed_slot_2',
      tutorId: 'seed_tutor_2',
      studentId: 'seed_student_2',
      subject: 'Python - OOP Concepts',
      startTime: Timestamp.fromDate(addDays(new Date(), 3)),
      endTime: Timestamp.fromDate(addHours(addDays(new Date(), 3), 1)),
      durationMinutes: 60,
      status: 'pending',
      roomId: null,
      paymentId: 'seed_payment_2',
      amount: 1200,
      currency: 'INR',
      cancellationReason: null,
      recordingConsent: false,
      notes: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      deletedAt: null,
    },
    // Completed session (student 1 with tutor 2)
    {
      id: 'seed_session_3',
      slotId: 'seed_slot_3',
      tutorId: 'seed_tutor_2',
      studentId: 'seed_student_1',
      subject: 'Web Development - React Hooks',
      startTime: Timestamp.fromDate(addDays(new Date(), -7)),
      endTime: Timestamp.fromDate(addHours(addDays(new Date(), -7), 1)),
      durationMinutes: 60,
      status: 'completed',
      roomId: 'room_session_3',
      paymentId: 'seed_payment_3',
      amount: 1200,
      currency: 'INR',
      cancellationReason: null,
      recordingConsent: true,
      notes: 'Great session! Covered useState, useEffect, and useContext hooks.',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      deletedAt: null,
    },
    // Cancelled session
    {
      id: 'seed_session_4',
      slotId: 'seed_slot_4',
      tutorId: 'seed_tutor_1',
      studentId: 'seed_student_2',
      subject: 'Physics - Optics',
      startTime: Timestamp.fromDate(addDays(new Date(), -3)),
      endTime: Timestamp.fromDate(addHours(addDays(new Date(), -3), 1)),
      durationMinutes: 60,
      status: 'cancelled',
      roomId: null,
      paymentId: 'seed_payment_4',
      amount: 1500,
      currency: 'INR',
      cancellationReason: 'Student had an emergency exam',
      recordingConsent: false,
      notes: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      deletedAt: null,
    },
    // Another upcoming confirmed (student 2 with tutor 1)
    {
      id: 'seed_session_5',
      slotId: 'seed_slot_5',
      tutorId: 'seed_tutor_1',
      studentId: 'seed_student_2',
      subject: 'Mathematics - Trigonometry',
      startTime: Timestamp.fromDate(addDays(new Date(), 5)),
      endTime: Timestamp.fromDate(addHours(addDays(new Date(), 5), 1)),
      durationMinutes: 60,
      status: 'confirmed',
      roomId: null,
      paymentId: 'seed_payment_5',
      amount: 1500,
      currency: 'INR',
      cancellationReason: null,
      recordingConsent: true,
      notes: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      deletedAt: null,
    },
  ];

  const payments = [
    { id: 'seed_payment_1', sessionId: 'seed_session_1', studentId: 'seed_student_1', tutorId: 'seed_tutor_1', amount: 1500, currency: 'INR', status: 'captured' },
    { id: 'seed_payment_2', sessionId: 'seed_session_2', studentId: 'seed_student_2', tutorId: 'seed_tutor_2', amount: 1200, currency: 'INR', status: 'created' },
    { id: 'seed_payment_3', sessionId: 'seed_session_3', studentId: 'seed_student_1', tutorId: 'seed_tutor_2', amount: 1200, currency: 'INR', status: 'captured' },
    { id: 'seed_payment_4', sessionId: 'seed_session_4', studentId: 'seed_student_2', tutorId: 'seed_tutor_1', amount: 1500, currency: 'INR', status: 'refunded' },
    { id: 'seed_payment_5', sessionId: 'seed_session_5', studentId: 'seed_student_2', tutorId: 'seed_tutor_1', amount: 1500, currency: 'INR', status: 'captured' },
  ];

  const batch = db.batch();
  for (const session of sessions) {
    const ref = db.collection('sessions').doc(session.id);
    const existing = await ref.get();
    if (!existing.exists) {
      batch.set(ref, session);
    }
  }
  for (const payment of payments) {
    const ref = db.collection('payments').doc(payment.id);
    const existing = await ref.get();
    if (!existing.exists) {
      batch.set(ref, {
        ...payment,
        razorpayOrderId: `mock_order_${payment.id}`,
        razorpayPaymentId: null,
        razorpaySignature: null,
        idempotencyKey: payment.sessionId,
        webhookProcessedAt: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  await batch.commit();
  console.log(`  ✓ Created ${sessions.length} sessions and ${payments.length} payments`);
}

async function seedChatRooms() {
  console.log('\n📦 Seeding chat rooms...');

  // Room: student_1 ↔ tutor_1
  const room1Id = ['seed_tutor_1', 'seed_student_1'].sort().join('_');
  const room1Ref = db.collection('rooms').doc(room1Id);
  const room1Exists = await room1Ref.get();
  if (!room1Exists.exists) {
    await room1Ref.set({
      participants: ['seed_tutor_1', 'seed_student_1'],
      lastMessageAt: FieldValue.serverTimestamp(),
      lastMessageText: 'See you tomorrow for the session!',
      unreadCount: { seed_student_1: 1 },
    });

    const messages1 = [
      { senderId: 'seed_student_1', content: 'Hi Arjun! I wanted to confirm our session tomorrow.', minutesAgo: 120 },
      { senderId: 'seed_tutor_1', content: 'Hello Rahul! Yes, I\'ll be ready at 10 AM. Please prepare chapters 7-9 on Calculus.', minutesAgo: 100 },
      { senderId: 'seed_student_1', content: 'Perfect! I\'ve already gone through those. I have some doubts about integration by parts.', minutesAgo: 90 },
      { senderId: 'seed_tutor_1', content: 'Great! We can start with that. It\'s one of the most important topics for JEE.', minutesAgo: 80 },
      { senderId: 'seed_student_1', content: 'Thank you! Looking forward to the session.', minutesAgo: 60 },
      { senderId: 'seed_tutor_1', content: 'See you tomorrow for the session!', minutesAgo: 5 },
    ];

    const msgBatch = db.batch();
    for (const msg of messages1) {
      const msgRef = room1Ref.collection('messages').doc();
      msgBatch.set(msgRef, {
        id: msgRef.id,
        roomId: room1Id,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: Timestamp.fromDate(new Date(now.getTime() - msg.minutesAgo * 60 * 1000)),
      });
    }
    await msgBatch.commit();
    console.log(`  ✓ Created room: student_1 ↔ tutor_1 (${messages1.length} messages)`);
  } else {
    console.log('  ✓ Room student_1 ↔ tutor_1 already exists');
  }

  // Room: student_2 ↔ tutor_2
  const room2Id = ['seed_tutor_2', 'seed_student_2'].sort().join('_');
  const room2Ref = db.collection('rooms').doc(room2Id);
  const room2Exists = await room2Ref.get();
  if (!room2Exists.exists) {
    await room2Ref.set({
      participants: ['seed_tutor_2', 'seed_student_2'],
      lastMessageAt: FieldValue.serverTimestamp(),
      lastMessageText: 'Sure! I\'ll send you some practice problems.',
      unreadCount: { seed_student_2: 2 },
    });

    const messages2 = [
      { senderId: 'seed_student_2', content: 'Hi Priya! I\'m struggling with Python decorators.', minutesAgo: 300 },
      { senderId: 'seed_tutor_2', content: 'No worries Ananya! Decorators can be tricky at first but are very powerful.', minutesAgo: 280 },
      { senderId: 'seed_student_2', content: 'Can we cover it in our next session?', minutesAgo: 260 },
      { senderId: 'seed_tutor_2', content: 'Absolutely! We\'ll start with first-class functions, then closures, then decorators step by step.', minutesAgo: 240 },
      { senderId: 'seed_student_2', content: 'That sounds perfect. Also can we look at some real-world examples?', minutesAgo: 30 },
      { senderId: 'seed_tutor_2', content: 'Sure! I\'ll send you some practice problems.', minutesAgo: 10 },
    ];

    const msgBatch2 = db.batch();
    for (const msg of messages2) {
      const msgRef = room2Ref.collection('messages').doc();
      msgBatch2.set(msgRef, {
        id: msgRef.id,
        roomId: room2Id,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: Timestamp.fromDate(new Date(now.getTime() - msg.minutesAgo * 60 * 1000)),
      });
    }
    await msgBatch2.commit();
    console.log(`  ✓ Created room: student_2 ↔ tutor_2 (${messages2.length} messages)`);
  } else {
    console.log('  ✓ Room student_2 ↔ tutor_2 already exists');
  }
}

async function seedReviews() {
  console.log('\n📦 Seeding reviews...');

  const reviews = [
    {
      id: 'seed_review_1',
      sessionId: 'seed_session_3',
      tutorId: 'seed_tutor_2',
      studentId: 'seed_student_1',
      rating: 5,
      comment: 'Priya is an incredible teacher! She explained React hooks in a way that finally made sense to me. Very patient and knowledgeable.',
      createdAt: FieldValue.serverTimestamp(),
    },
  ];

  const batch = db.batch();
  for (const review of reviews) {
    const ref = db.collection('reviews').doc(review.id);
    const existing = await ref.get();
    if (!existing.exists) {
      batch.set(ref, review);
    }
  }
  await batch.commit();
  console.log(`  ✓ Created ${reviews.length} reviews`);
}

async function seedNotifications() {
  console.log('\n📦 Seeding notifications...');

  const notifications = [
    {
      userId: 'seed_student_1',
      type: 'session_confirmed',
      title: 'Session Confirmed!',
      message: 'Your session with Arjun Sharma on Mathematics - JEE Calculus has been confirmed.',
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    },
    {
      userId: 'seed_student_1',
      type: 'session_reminder',
      title: 'Session Tomorrow',
      message: 'Reminder: You have a session with Arjun Sharma tomorrow at 10:00 AM.',
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    },
    {
      userId: 'seed_tutor_1',
      type: 'new_booking',
      title: 'New Session Booked',
      message: 'Rahul Verma has booked a session with you for Mathematics - JEE Calculus.',
      isRead: true,
      createdAt: FieldValue.serverTimestamp(),
    },
    {
      userId: 'seed_student_2',
      type: 'session_pending',
      title: 'Session Pending Payment',
      message: 'Your session with Priya Mehta for Python - OOP Concepts is pending payment.',
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    },
  ];

  const batch = db.batch();
  for (const notif of notifications) {
    const ref = db.collection('notifications').doc();
    batch.set(ref, notif);
  }
  await batch.commit();
  console.log(`  ✓ Created ${notifications.length} notifications`);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting Firestore seed...');
  console.log(`📡 Project: ${process.env.FIREBASE_PROJECT_ID}\n`);

  try {
    await seedUsers();
    await seedTutorProfiles();
    await seedAvailabilitySlots();
    await seedSessions();
    await seedChatRooms();
    await seedReviews();
    await seedNotifications();

    console.log('\n✅ Seed complete!');
    console.log('\n📋 Test Accounts:');
    console.log('  Tutor 1:   arjun.tutor@peernova.test    / TestPass123!  (uid: seed_tutor_1)');
    console.log('  Tutor 2:   priya.tutor@peernova.test    / TestPass123!  (uid: seed_tutor_2)');
    console.log('  Student 1: rahul.student@peernova.test  / TestPass123!  (uid: seed_student_1)');
    console.log('  Student 2: ananya.student@peernova.test / TestPass123!  (uid: seed_student_2)');
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  }
}

main();
