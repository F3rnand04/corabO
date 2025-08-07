
"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
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

// Explicitly set the custom auth domain for the provider to match the deployment environment.
// This is the definitive fix for the 'unauthorized-domain' error in this context.
provider.setCustomParameters({
  'authDomain': 'studio--corabo-demo.us-central1.hosted.app'
});


export { app, auth, db, provider, signInWithPopup, signOut, onAuthStateChanged };
