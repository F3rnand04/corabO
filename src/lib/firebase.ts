
// IMPORTANT: This file MUST have the "use client" directive.
// It's intended for client-side components and hooks.
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
let auth;

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
db = getFirestore(app);
auth = getAuth(app);

// NOTE: We are now relying on the Firebase SDK's automatic detection of emulators
// based on environment variables (like FIREBASE_AUTH_EMULATOR_HOST), which are
// set by the Firebase Studio environment. Explicit connection calls are removed
// to prevent network errors in the hosted development environment.


export function getFirebaseApp(): FirebaseApp {
    return app;
}

// This function provides a client-side instance of Firestore.
export function getFirestoreDb(): Firestore {
    return db;
}
