import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

function initializeAdminApp() {
    if (getApps().length > 0) {
        return admin.app();
    }

    if (!process.env.FIREBASE_PRIVATE_KEY_B64) {
        throw new Error('The FIREBASE_PRIVATE_KEY_B64 environment variable is not defined.');
    }

    // Decode the Base64 private key from the environment variable
    const decodedPrivateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf8');

    const serviceAccount = {
        type: process.env.FIREBASE_TYPE || 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: decodedPrivateKey, // Use the decoded key
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        universe_domain: process.env.UNIVERSE_DOMAIN || 'googleapis.com',
    };

    try {
        if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
            throw new Error('Firebase service account details are missing or incomplete in environment variables.');
        }

        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
            databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
            storageBucket: `${serviceAccount.project_id}.appspot.com`
        });
    } catch (error: any) {
        console.error("Firebase Admin Initialization Error:", error);
        throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    }
}

const adminApp = initializeAdminApp();

export const getFirebaseAdminApp = () => adminApp;
export const getFirebaseAuth = () => admin.auth(adminApp);
export const getFirebaseFirestore = () => admin.firestore(adminApp);
export const getFirebaseStorage = () => getStorage(adminApp);
