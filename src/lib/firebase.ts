// IMPORTANT: This file MUST have the "use client" directive.
// It's intended for client-side components and hooks.
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";

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
let auth: Auth;
let emulatorsConnected = false;

function getFirebaseAppInstance(): FirebaseApp {
    if (getApps().length === 0) {
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

function connectToEmulators() {
    if (emulatorsConnected) return;

    const host = window.location.hostname;
    
    // Ensure instances exist before connecting
    // This is the core fix: get the instances before using them.
    const firestoreInstance = getFirestoreDb(); 
    const authInstance = getAuthInstance();

    connectFirestoreEmulator(firestoreInstance, host, 8083);
    connectAuthEmulator(authInstance, `http://${host}:9101`, { disableWarnings: true });
    
    emulatorsConnected = true;
    console.log("Firebase Emulators connected.");
}


export function getFirestoreDb(): Firestore {
    if (!db) {
        app = getFirebaseApp();
        db = getFirestore(app);
        if (process.env.NODE_ENV === 'development') {
            connectToEmulators();
        }
    }
    return db;
}

export function getAuthInstance(): Auth {
    if (!auth) {
        app = getFirebaseApp();
        auth = getAuth(app);
        if (process.env.NODE_ENV === 'development') {
            connectToEmulators();
        }
    }
    return auth;
}
