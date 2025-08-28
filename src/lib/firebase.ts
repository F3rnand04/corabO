
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

const app: FirebaseApp = initializeFirebaseApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error("Could not initialize Analytics:", error);
  }
}

export function getFirebaseApp(): FirebaseApp {
    return app;
}

export function getFirestoreDb(): Firestore {
    return db;
}

export function getAuthInstance(): Auth {
    return auth;
}
