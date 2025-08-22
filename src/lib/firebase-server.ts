// IMPORTANT: This file should NOT have the "use client" directive.
// It's intended for server-side code, like Genkit flows.

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './firebase-config';

let app: App;
let db: Firestore;

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

function getFirebaseAdminApp(): App {
  if (getApps().length) {
    return getApps()[0]!;
  }
  
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable not set. Server-side Firebase cannot be initialized.');
  }

  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: firebaseConfig.storageBucket,
  });
  return app;
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    const adminApp = getFirebaseAdminApp();
    db = getFirestore(adminApp);
  }
  return db;
}
