'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig } from './firebase-config';


// --- Firebase App Initialization (Singleton) ---
function initializeFirebaseApp() {
    if (getApps().length) {
        return getApp();
    }
    return initializeApp(firebaseConfig);
}

const app: FirebaseApp = initializeFirebaseApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();


// --- Emulator Connection for Local Development ---
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    try {
        console.log("Localhost detected. Connecting to local Firebase emulators...");
        
        // Connect to Firestore Emulator
        connectFirestoreEmulator(db, 'localhost', 8083);

        // Connect to Auth Emulator
        connectAuthEmulator(auth, 'http://localhost:9100', { disableWarnings: true });

        // Connect to Storage Emulator
        connectStorageEmulator(storage, 'localhost', 9199);
        
        console.log("Successfully configured ALL emulators for local development.");
    } catch (error) {
        console.error("Error connecting to Firebase Emulators on localhost:", error);
    }
}


export { app, auth, db, storage, googleProvider };
