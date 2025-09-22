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

    // In a production environment, the service account key MUST be provided.
    // In a local emulator environment, the SDK can auto-discover the emulators
    // if we initialize without any arguments.
    if (serviceAccount) {
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: firebaseConfig.projectId,
            storageBucket: firebaseConfig.storageBucket,
        });
    } else if (process.env.FIRESTORE_EMULATOR_HOST) {
        // If we are in an emulator environment (detected by env var),
        // initialize without credentials. The SDK will connect automatically.
        return admin.initializeApp({
            projectId: firebaseConfig.projectId,
            storageBucket: firebaseConfig.storageBucket,
        });
    } else {
        // In a real production environment without emulators, this would be a critical error.
        console.warn(
            "ADVERTENCIA: La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida. El SDK de Admin no pudo autenticarse. Esto solo funcionará si los emuladores de Firebase están activos."
        );
        // We initialize without options, hoping emulators are running.
        return admin.initializeApp();
    }
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
