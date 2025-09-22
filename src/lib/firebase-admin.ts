/**
 * @fileOverview Centralized Firebase Admin SDK initialization.
 * This file is the single source of truth for the Firebase Admin App instance,
 * ensuring it is initialized only once for all server-side operations.
 */
import admin from 'firebase-admin';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { firebaseConfig } from './firebase-config';


// --- Singleton Pattern for Admin SDK ---
// This prevents multiple initializations in serverless environments.

function initializeAdminApp(): admin.app.App {
    if (admin.apps.length > 0) {
        return admin.app();
    }
    
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : undefined;

    // In a local emulator environment, service account might not be needed.
    // The check for FIRESTORE_EMULATOR_HOST ensures we don't throw in a dev environment.
    if (!serviceAccount && !process.env.FIRESTORE_EMULATOR_HOST) {
        console.warn("ADVERTENCIA: La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida. Se asumirá un entorno de emulador, pero esto fallará en producción.");
    }

    const app = admin.initializeApp({
        credential: serviceAccount ? admin.credential.cert(serviceAccount) : undefined,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
    });

    return app;
}

const adminApp = initializeAdminApp();

// Export getter functions for each service
export function getFirebaseAuth(): Auth {
    return getAuth(adminApp);
}

export function getFirebaseFirestore(): Firestore {
    return getFirestore(adminApp);
}

export function getFirebaseStorage(): admin.storage.Storage {
    return getStorage(adminApp);
}

export function getFirebaseMessaging(): Messaging {
    return getMessaging(adminApp);
}
