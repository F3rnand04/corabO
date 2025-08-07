
"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, initializeFirestore } from "firebase/firestore";

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


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore differently for client and server
let db;

if (typeof window !== 'undefined') {
  // Client-side
  try {
    db = initializeFirestore(app, {
      localCache: enableIndexedDbPersistence({
        forceOwnership: true,
      }),
    });
    console.log("Firestore persistence enabled.");
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'failed-precondition') {
      console.warn("Multiple tabs open, persistence can only be enabled in one. Using regular firestore instance.");
      db = getFirestore(app);
    } else {
      console.error("Error enabling Firestore persistence:", error);
      db = getFirestore(app); // Fallback to regular instance
    }
  }
} else {
  // Server-side
  db = getFirestore(app);
}

export { app, db };
