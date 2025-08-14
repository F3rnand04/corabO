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

function getFirebaseAppInstance(): FirebaseApp {
    if (getApps().length === 0) {
        return initializeApp(firebaseConfig);
    } else {
        return getApp();
    }
}

app = getFirebaseAppInstance();

// Use initializeAuth to configure persistence.
// The SDK will automatically detect emulator settings from environment variables.
auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

db = getFirestore(app);

// NOTE: We no longer need to manually connect to emulators here.
// Firebase's SDK automatically detects the FIREBASE_AUTH_EMULATOR_HOST 
// and FIREBASE_FIRESTORE_EMULATOR_HOST environment variables set by Firebase Studio.
// Manually calling connect*Emulator was causing initialization conflicts.

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
