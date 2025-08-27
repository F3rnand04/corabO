
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { firebaseConfig } from './firebase-config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    if (typeof window !== "undefined") {
        analytics = getAnalytics(app);
    }
} catch (error) {
    console.error("Error initializing Firebase:", error);
    // Handle initialization error gracefully, maybe show a message to the user
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
