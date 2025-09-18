
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, getFirestore as getFirestoreInstance } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  "projectId": "corabo-demo",
  "appId": "1:220291714642:web:3aca123e39a92f16c0998b",
  "storageBucket": "corabo-demo.appspot.com",
  "apiKey": "AIzaSyAOZ9eRQz1Sry6pdLNwCVZ3QNsr1pZgHnQ",
  "authDomain": "corabo-demo.firebaseapp.com",
  "measurementId": "G-CYN8E0S2VZ",
  "messagingSenderId": "220291714642"
};

// --- Firebase App Initialization (Singleton) ---
function initializeFirebaseApp() {
    if (getApps().length) {
        return getApp();
    }
    return initializeApp(firebaseConfig);
}

const app = initializeFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


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


export { app, auth, db, storage, getFirestoreInstance };

