
// IMPORTANT: This file MUST have the "use client" directive.
// It's intended for client-side components and hooks.
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { firebaseConfig } from './firebase-config'; // Import from the SHARED config

// Singleton instances
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

// This function ensures Firebase is initialized only once.
function getFirebaseAppInstance(): FirebaseApp {
    if (getApps().length === 0) {
        return initializeApp(firebaseConfig);
    } else {
        return getApp();
    }
}

// These functions provide singleton instances of Firebase services.
// The Firebase SDK will automatically detect and connect to emulators
// if the appropriate environment variables are set by the hosting environment.
export function getFirebaseApp(): FirebaseApp {
    if (!app) {
        app = getFirebaseAppInstance();
    }
    return app;
}

export function getFirestoreDb(): Firestore {
    if (!db) {
        const app = getFirebaseApp();
        db = getFirestore(app);
    }
    return db;
}

export function getAuthInstance(): Auth {
    if (!auth) {
        const app = getFirebaseApp();
        auth = getAuth(app);
    }
    return auth;
}
