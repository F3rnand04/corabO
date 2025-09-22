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

    // In an emulator environment, initialize without credentials.
    // The SDK will connect automatically if the FIRESTORE_EMULATOR_HOST is set.
    if (process.env.FIRESTORE_EMULATOR_HOST) {
        return admin.initializeApp({
            projectId: firebaseConfig.projectId,
            storageBucket: firebaseConfig.storageBucket,
        });
    }

    // In a production environment, the service account key MUST be provided.
    if (serviceAccount) {
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: firebaseConfig.projectId,
            storageBucket: firebaseConfig.storageBucket,
        });
    }

    // If neither emulator nor service account is found, it's a critical error.
    throw new Error(
        "CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY no está definida y no se detectan emuladores. El backend no puede autenticarse."
    );
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
