
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { firebaseConfig } from './firebase-config';

// This file is simplified to only connect to the production Firebase services.
// The emulator connection logic has been removed as it was causing deployment failures.

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let analytics: Analytics | null = null;

function getFirebaseAppInstance(): FirebaseApp {
    if (!getApps().length) {
        return initializeApp(firebaseConfig);
    } else {
        return getApp();
    }
}

export function getFirebaseApp(): FirebaseApp {
    if (!app) {
        app = getFirebaseAppInstance();
    }
    return app;
}

export function getFirestoreDb(): Firestore {
    if (!db) {
        const currentApp = getFirebaseApp();
        db = getFirestore(currentApp);
    }
    return db;
}

export function getAuthInstance(): Auth {
    if (!auth) {
        const currentApp = getFirebaseApp();
        auth = getAuth(currentApp);
        auth.languageCode = 'es';
    }
    return auth;
}

// Initialize Analytics and Crashlytics
const appInstance = getFirebaseApp();
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(appInstance);
        }
    });
}
