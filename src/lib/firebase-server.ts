
// IMPORTANT: This file should NOT have the "use client" directive.
// It's intended for server-side code, like Genkit flows.

import { initializeApp, getApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';
import { firebaseConfig } from './firebase-config';

// This function ensures the Firebase Admin app is initialized only once.
function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // In a Google Cloud environment (like App Hosting), the SDK can
  // auto-discover credentials. No need to pass them explicitly.
  const app = initializeApp({
    credential: credential.applicationDefault(),
    storageBucket: firebaseConfig.storageBucket,
  });
  
  return app;
}


// This function provides a server-side instance of Firestore.
export function getFirestoreDb(): Firestore {
    const app = getFirebaseAdminApp();
    return getFirestore(app);
}
