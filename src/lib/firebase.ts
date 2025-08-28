
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { firebaseConfig } from './firebase-config';

// This function ensures that the Firebase app is initialized only once (Singleton pattern).
const initializeFirebaseApp = (): FirebaseApp => {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
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
        analytics = getAnalytics(app);
    }
} catch (error) {
    console.error("Firebase initialization failed:", error);
    // In a real app, you might want to show a more user-friendly error message
    // or attempt to recover, but for now, we log the error.
}


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
