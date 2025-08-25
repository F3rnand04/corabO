
// IMPORTANT: This file should NOT have the "use client" directive.
// It's intended for server-side code, like Genkit flows.

import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './firebase-config';

// This function ensures a single instance of the Firebase Admin app is initialized and reused.
function getFirebaseAdminApp(): App {
  if (getApps().length) {
    return getApp();
  }
  // When running in a Google Cloud environment (like App Hosting),
  // the Admin SDK can automatically discover credentials.
  return initializeApp({
      projectId: firebaseConfig.projectId
  });
}

// This function provides the initialized Firebase Admin SDK instances.
export function getFirebaseAdmin() {
  const app = getFirebaseAdminApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { auth, firestore, app };
}
