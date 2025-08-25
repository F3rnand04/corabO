// IMPORTANT: This file should NOT have the "use client" directive.
// It's intended for server-side code, like Genkit flows.

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let app: App;
let auth: Auth;
let db: Firestore;

// This function ensures a single instance of the Firebase Admin app is initialized and reused.
// By calling initializeApp() without arguments, it automatically uses the Application
// Default Credentials provided by the Google Cloud environment (like App Hosting).
function initializeFirebaseAdmin() {
  if (!getApps().length) {
    app = initializeApp();
  } else {
    app = getApps()[0]!;
  }
  auth = getAuth(app);
  db = getFirestore(app);
}

// Initialize on module load
initializeFirebaseAdmin();

// This function provides the initialized Firebase Admin SDK instances.
export function getFirebaseAdmin() {
  // The services are already initialized, so we just return them.
  // This safeguards against any potential race conditions, though unlikely.
  if (!app || !auth || !db) {
    initializeFirebaseAdmin();
  }
  return { auth, firestore: db };
}
