
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { firebaseConfig } from './firebase-config';

// This function ensures that the Firebase app is initialized only once (Singleton pattern).
// By passing the full firebaseConfig object, we ensure that critical properties like 
// authDomain are correctly set, which is the definitive solution for redirect_uri_mismatch errors.
const initializeFirebaseApp = (): FirebaseApp => {
  if (getApps().length) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
};

// Singleton instances
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

// Initialize Firebase and its services
try {
    app = initializeFirebaseApp();
    auth = getAuth(app);
    db = getFirestore(app);
    if (typeof window !== 'undefined') {
        // Analytics can be initialized here if needed
    }
} catch (error) {
    console.error("Firebase initialization failed:", error);
}

// Export getter functions to ensure singletons are used throughout the app.
export function getFirebaseApp(): FirebaseApp {
    if (!app) {
        app = initializeFirebaseApp();
    }
    return app;
}

export function getFirestoreDb(): Firestore {
    if (!db) {
        db = getFirestore(getFirebaseApp());
    }
    return db;
}

export function getAuthInstance(): Auth {
    if (!auth) {
        auth = getAuth(getFirebaseApp());
    }
    return auth;
}
