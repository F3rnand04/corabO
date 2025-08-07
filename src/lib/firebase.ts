
"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// We will now get auth and provider directly in the context to avoid singleton issues.

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

// --- START: Dynamic Auth Domain Fix ---
// This block dynamically sets the authDomain for specific development environments.
if (typeof window !== 'undefined' && window.location.hostname.endsWith('cloudworkstations.dev')) {
    try {
        const appInstance = getApp();
        appInstance.options.authDomain = window.location.hostname;
        // This log is for debugging and can be removed later.
        console.log(`Firebase authDomain dynamically set to: ${appInstance.options.authDomain}`);
    } catch (e) {
        console.error("Could not dynamically set Firebase authDomain:", e);
    }
}
// --- END: Dynamic Auth Domain Fix ---


const db = getFirestore(app);

export { app, db };
