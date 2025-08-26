// IMPORTANT: This file should NOT have the "use client" directive.
// It's intended for server-side code, like Genkit flows.

import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './firebase-config';

let app: App;

// This function ensures a single instance of the Firebase Admin app is initialized and reused.
function getFirebaseAdminApp(): App {
  if (app) {
    return app;
  }
  
  if (getApps().length) {
    app = getApp();
    return app;
  }
  
  app = initializeApp({
      projectId: firebaseConfig.projectId
  });
  return app;
}

// This function provides the initialized Firebase Admin SDK instances.
export function getFirebaseAdmin() {
  const currentApp = getFirebaseAdminApp();
  const auth: Auth = getAuth(currentApp);
  const firestore: Firestore = getFirestore(currentApp);
  return { auth, firestore, app: currentApp };
}
