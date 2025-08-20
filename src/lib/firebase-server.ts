// IMPORTANT: This file should NOT have the "use client" directive.
// It's intended for server-side code, like Genkit flows.

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from './firebase-config'; // Import from the SHARED config

let app: FirebaseApp;
let db: Firestore;

// This function ensures Firebase is initialized only once on the server.
function getFirebaseAppInstance(): FirebaseApp {
    if (!getApps().length) {
        // No apps initialized, create a new one.
        app = initializeApp(firebaseConfig);
    } else {
        // App already initialized, get the existing one.
        app = getApp();
    }
    return app;
}

// This function provides a server-side instance of Firestore.
export function getFirestoreDb(): Firestore {
    if (!db) {
        app = getFirebaseAppInstance();
        db = getFirestore(app);
    }
    return db;
}
