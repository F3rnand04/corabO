
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, type Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { firebaseConfig } from './firebase-config';

// This function ensures that the Firebase app is initialized only once (Singleton pattern).
// By passing the full firebaseConfig object, we ensure that critical properties like 
// authDomain are correctly set, which is the definitive solution for redirect_uri_mismatch errors.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// --- Emulator Connection for Local Development ---
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  try {
      // Connect to Firestore Emulator
      connectFirestoreEmulator(db, 'localhost', 8083);
      // Connect to Auth Emulator
      connectAuthEmulator(auth, 'http://localhost:9100', { disableWarnings: true });
  } catch (error) {
      console.error("Error connecting to Firebase Emulators on localhost:", error);
  }
}

// Export the initialized instances directly for robust and consistent access across the client-side app.
export { app, auth, db };
