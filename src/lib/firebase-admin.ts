
/**
 * @fileOverview Centralized Firebase Admin SDK initialization.
 * This file is the single source of truth for the Firebase Admin App instance,
 * ensuring it is initialized only once for all server-side operations.
 */
import admin from 'firebase-admin';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';


// --- Singleton Pattern for Admin SDK ---
// This prevents multiple initializations in serverless environments.

function initializeAdminApp(): admin.app.App {
    if (admin.apps.length) {
        return admin.app();
    }
    
    // This check is crucial. If NEXT_RUNTIME is not 'nodejs', we are in a client-side
    // environment or an environment that doesn't support the Admin SDK (like Edge Runtime).
    // This entire file should only ever be imported in 'nodejs' (server) environments.
    if (process.env.NEXT_RUNTIME !== 'nodejs') {
        throw new Error("CRITICAL: El SDK de Firebase Admin no puede ser importado en el cliente.");
    }

    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        throw new Error("CRITICAL: La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida. El backend no puede conectar con Firebase.");
    }
    
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "corabo-demo.appspot.com"
    });

    return app;
}


// Export getter functions for each service
export function getFirebaseAuth(): Auth {
    return getAuth(initializeAdminApp());
}

export function getFirebaseFirestore(): Firestore {
    return getFirestore(initializeAdminApp());
}

export function getFirebaseStorage(): Storage {
    return getStorage(initializeAdminApp());
}

export function getFirebaseMessaging(): Messaging {
    return getMessaging(initializeAdminApp());
}
