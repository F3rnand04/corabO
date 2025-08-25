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
function initializeFirebaseAdmin() {
    if (getApps().length > 0) {
        app = getApps()[0]!;
    } else {
        const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccountEnv) {
            try {
                const serviceAccount = JSON.parse(serviceAccountEnv);
                app = initializeApp({
                    credential: cert(serviceAccount),
                    projectId: firebaseConfig.projectId,
                    storageBucket: firebaseConfig.storageBucket,
                });
            } catch (e) {
                console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT. Using default credentials.', e);
                app = initializeApp({
                    projectId: firebaseConfig.projectId,
                    storageBucket: firebaseConfig.storageBucket,
                });
            }
        } else {
            console.warn('FIREBASE_SERVICE_ACCOUNT environment variable not set. Using default credentials. This might fail in some environments.');
            app = initializeApp({
                projectId: firebaseConfig.projectId,
                storageBucket: firebaseConfig.storageBucket,
            });
        }
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
}

// Initialize on module load
initializeFirebaseAdmin();

// This function provides the initialized Firebase Admin SDK instances.
export function getFirebaseAdmin() {
    if (!app || !auth || !db) {
      // This should not happen if the module is loaded correctly, but it's a safeguard.
      initializeFirebaseAdmin();
    }
    return { auth, firestore: db };
}
