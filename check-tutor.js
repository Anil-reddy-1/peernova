require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccountJson = Buffer.from(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '',
  'base64',
).toString('utf-8');

const serviceAccount = JSON.parse(serviceAccountJson);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function check() {
  const uid = "NkyW8DSSOfMGVg9M8ZxuPT7PPpr2";
  
  const userDoc = await db.collection('users').doc(uid).get();
  console.log("User doc exists?", userDoc.exists);
  
  const tutorDoc = await db.collection('tutors').doc(uid).get();
  console.log("Tutor doc exists?", tutorDoc.exists);
}

check().catch(console.error);
