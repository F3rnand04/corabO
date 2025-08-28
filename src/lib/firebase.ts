
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from './firebase-config';

// This function ensures that the Firebase app is initialized only once (Singleton pattern).
// By passing the full firebaseConfig object, we ensure that critical properties like 
// authDomain are correctly set, which is the definitive solution for redirect_uri_mismatch errors.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Export the initialized instances directly.
export { app, auth, db };

// Export getter functions for legacy compatibility if needed, though direct imports are preferred.
export function getFirebaseApp(): FirebaseApp {
    return app;
}

export function getFirestoreDb(): Firestore {
    return db;
}

export function getAuthInstance(): Auth {
    return auth;
}
