// IMPORTANT: This file MUST have the "use client" directive.
// It's intended for client-side components and hooks.
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { initializeAuth, connectAuthEmulator, browserLocalPersistence, type Auth } from "firebase/auth";

// Your web app's Firebase configuration - KEEP THIS AS IS FROM THE CONSOLE
const firebaseConfig = {
  "projectId": "corabo-demo",
  "appId": "1:220291714642:web:3aca123e39a92f16c0998b",
  "storageBucket": "corabo-demo.firebasestorage.app",
  "apiKey": "AIzaSyAOZ9eRQz1Sry6pdLNwCVZ3QNsr1pZgHnQ",
  "authDomain": "corabo-demo.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "220291714642"
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

// This flag ensures we only connect to the emulators once.
let emulatorsConnected = false;

function getFirebaseAppInstance(): FirebaseApp {
    if (getApps().length === 0) {
        return initializeApp(firebaseConfig);
    } else {
        return getApp();
    }
}

app = getFirebaseAppInstance();

// Use initializeAuth to configure persistence and emulator settings
auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

db = getFirestore(app);

// Connect to emulators only in the local development environment.
if (process.env.NODE_ENV === 'development' && !emulatorsConnected) {
  // Point the SDKs to the emulators
  connectAuthEmulator(auth, "http://127.0.0.1:9101", { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8083);

  emulatorsConnected = true;
  console.log("Successfully connected to Firebase emulators.");
}


export function getFirebaseApp(): FirebaseApp {
    return app;
}

// This function provides a client-side instance of Firestore.
export function getFirestoreDb(): Firestore {
    return db;
}

// This function provides a client-side instance of Auth.
export function getAuthInstance(): Auth {
    return auth;
}
