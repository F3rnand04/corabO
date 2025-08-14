// IMPORTANT: This file should NOT have the "use client" directive.
// It's intended for server-side code, like Genkit flows.

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from './firebase-config'; // Import from the SHARED config

// Your web app's Firebase configuration is now inherited.

let app: FirebaseApp;
let db: Firestore;


function getFirebaseAppInstance(): FirebaseApp {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    return app;
}

// This function provides a server-side instance of Firestore.
// It will automatically connect to emulators if the correct environment variables are set.
export function getFirestoreDb(): Firestore {
    if (!db) {
        app = getFirebaseAppInstance();
        db = getFirestore(app);
    }
    return db;
}
