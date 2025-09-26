'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig } from './firebase-config';

// --- Firebase App Initialization (Singleton) ---
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// --- Emulator Connection for Development ---
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  try {
    // @ts-ignore
    if (!auth.emulatorConfig) {
        console.log(`Connecting to Firebase emulators on host: ${window.location.hostname}`);
        connectAuthEmulator(auth, `http://127.0.0.1:9201`, { disableCors: true });
        connectFirestoreEmulator(db, '127.0.0.1', 8183);
        connectStorageEmulator(storage, '127.0.0.1', 9299);
        console.log('Successfully connected to Firebase emulators.');
    }
  } catch (error) {
    console.error('Error connecting to Firebase emulators:', error);
  }
}


export { app, auth, db, storage, googleProvider };
