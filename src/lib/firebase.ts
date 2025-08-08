
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

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

function initializeFirebase() {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    db = getFirestore(app);
}

initializeFirebase();

// Function to get the initialized Firebase app instance
function getFirebaseApp(): FirebaseApp {
    if (!app) initializeFirebase();
    return app;
}

// Function to get the initialized Firestore instance
function getFirestoreDb(): Firestore {
    if (!db) initializeFirebase();
    return db;
}


export { getFirebaseApp, getFirestoreDb };
