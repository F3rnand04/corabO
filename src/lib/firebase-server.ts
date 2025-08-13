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

function getFirebaseAppInstance(): FirebaseApp {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    return app;
}

// Initialize the app instance
app = getFirebaseAppInstance();

// This function provides a server-side instance of Firestore.
export function getFirestoreDb(): Firestore {
    if (!db) {
        db = getFirestore(app);
        // Connect to emulators if running in a local/dev environment
        // Genkit/Firebase Functions emulators often set this env var.
        if (process.env.FIRESTORE_EMULATOR_HOST) {
            console.log(`(Server) Connecting to Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
            const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
            connectFirestoreEmulator(db, host, parseInt(port));
        } else if(process.env.NODE_ENV === 'development') {
            console.log("(Server) NODE_ENV is development, connecting to Firestore Emulator at localhost:8081");
            connectFirestoreEmulator(db, "localhost", 8081);
        }
    }
    return db;
}

export function getFirebaseApp(): FirebaseApp {
    return app;
}
