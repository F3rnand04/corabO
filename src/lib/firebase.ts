
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

let db;

if (typeof window !== 'undefined') {
  try {
    // This will only be executed on the client side
    db = getFirestore(app);
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn("Firestore persistence failed: Multiple tabs open.");
      } else if (err.code == 'unimplemented') {
        console.warn("Firestore persistence failed: Browser does not support persistence.");
      }
    });
  } catch (e) {
    console.error("Error enabling persistence", e);
    // Fallback to regular initialization if persistence fails
    db = getFirestore(app);
  }
} else {
  // For server-side rendering, just initialize without persistence
  db = getFirestore(app);
}


export { app, db };
