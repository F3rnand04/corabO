
"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
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
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Dynamically set auth domain for different environments
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  // This covers both the development (cloudworkstations) and deployed (hosted.app) environments.
  if (hostname.includes('cloudworkstations.dev') || hostname.includes('hosted.app')) {
    provider.setCustomParameters({
      'authDomain': hostname
    });
  }
}

export { app, auth, db, provider };
