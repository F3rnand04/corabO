"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { firebaseConfig } from '@/lib/firebase-config';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

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
