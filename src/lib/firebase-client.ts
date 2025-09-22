'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig } from './firebase-config';


// --- Firebase App Initialization (Singleton) ---
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();


// --- Emulator Connection for Local Development ---
// This logic ensures emulators are connected only once and only on the client-side
// in a localhost environment.
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Check if emulators are already connected to prevent re-connection errors on hot reloads
    if (!(auth as any)._isEmulator) {
        console.log("Connecting to Firebase Emulators...");
        try {
            connectAuthEmulator(auth, 'http://127.0.0.1:9101', { disableWarnings: true });
            connectFirestoreEmulator(db, '127.0.0.1', 8083);
            connectStorageEmulator(storage, '127.0.0.1', 9199);
            console.log("Successfully connected to all Firebase emulators.");
        } catch (error) {
            console.error("Error connecting to Firebase Emulators:", error);
        }
    }
}


export { app, auth, db, storage, googleProvider };
