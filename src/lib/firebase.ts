

import { initializeApp, getApps, getApp } from "firebase/app";
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
auth.tenantId = null; // Ensure we are not using a multi-tenant context
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  'auth_type': 'reauthenticate'
});


export { app, auth, db, provider };
