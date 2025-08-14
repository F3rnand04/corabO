
// IMPORTANT: This file should NOT have the "use client" directive.
// It's intended for server-side code, like Genkit flows.

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration - KEEP THIS AS IS FROM THE CONSOLE
const firebaseConfig = {
  "projectId": "corabo-demo",
  "appId": "1:220291714642:web:3aca123e39a92f16c0998b",
  "storageBucket": "corabo-demo.firebasestorage.app",
  "apiKey": "AIzaSyAOZ9eRQz1Sry6pdLNwCVZ3QNsr1pZgHnQ",
  "authDomain": "corabo-demo.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "220291714642"
};

let app: FirebaseApp;
let db: Firestore;

// This flag ensures we only connect to the emulators once.
let emulatorsConnected = false;

function getFirebaseAppInstance(): FirebaseApp {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
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
    // Connect to emulators if running in a local/dev environment and not already connected
    if (!emulatorsConnected && process.env.NODE_ENV === 'development') {
        console.log(`(Server) Connecting to Firestore Emulator...`);
        // NOTE: The port must match firebase.json for the firestore emulator
        connectFirestoreEmulator(db, "localhost", 8083);
        emulatorsConnected = true;
    }
    return db;
}
