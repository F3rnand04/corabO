
// IMPORTANT: This file should NOT have the "use client" directive.
// It's intended for server-side code, like Genkit flows.

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './firebase-config';

let app: App;
let auth: Auth;
let db: Firestore;

// This function ensures a single instance of the Firebase Admin app is initialized and reused.
function getFirebaseAdminApp() {
    if (getApps().length) {
        return getApps()[0]!;
    }
    
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : undefined;

    if (!serviceAccount) {
        console.error('FIREBASE_SERVICE_ACCOUNT environment variable not set. Falling back to default credentials. This might fail in some environments.');
         return initializeApp({
            storageBucket: firebaseConfig.storageBucket,
        });
    }

    app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: firebaseConfig.storageBucket,
    });
    return app;
}

// This function provides the initialized Firebase Admin SDK instance.
export function getFirebaseAdmin() {
    if (!app) {
        app = getFirebaseAdminApp();
    }
    if (!auth) {
        auth = getAuth(app);
    }
    if (!db) {
        db = getFirestore(app);
    }
    return { auth, firestore: db };
}
