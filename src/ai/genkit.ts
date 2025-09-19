
/**
 * @fileOverview Central Genkit initialization and Firebase Admin SDK setup.
 * This file is the single source of truth for the Genkit `ai` instance and
 * ensures Firebase Admin is initialized once for all server-side operations.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import {initializeApp, getApps, App, type AppOptions} from 'firebase-admin/app';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/lib/firebase-config';

let adminApp: App;
let adminAuth: Auth;

// This pattern ensures that Firebase Admin is initialized only once.
if (!getApps().some(app => app.name === 'admin')) {
  const appOptions: AppOptions = {
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
  };
  adminApp = initializeApp(appOptions, 'admin');
} else {
  adminApp = getApps().find(app => app.name === 'admin')!;
}

adminAuth = getAdminAuth(adminApp);

// Export a getter function for the admin auth instance. This is the single, reliable
// way for other server-side modules to get the auth instance.
export function getFirebaseAuth(): Auth {
    return adminAuth;
}

// Configure and export the Genkit AI instance.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
