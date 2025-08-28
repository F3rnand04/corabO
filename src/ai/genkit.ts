
/**
 * @fileOverview Central Genkit initialization and Firebase Admin SDK setup.
 * This file is the single source of truth for the Genkit `ai` instance and
 * ensures Firebase Admin is initialized once for all server-side operations.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import {initializeApp, getApps, App, type AppOptions, deleteApp} from 'firebase-admin/app';
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/lib/firebase-config';

let adminApp: App;
let adminAuth: Auth;

function initializeFirebaseAdmin(): App {
  const an_app = getApps().find((app) => app.name === 'admin');
  if (an_app) {
    deleteApp(an_app);
  }

  // Explicitly provide the project configuration to the SDK.
  // This removes ambiguity and ensures the server authenticates with the correct project.
  const appOptions: AppOptions = {
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
  };

  return initializeApp(appOptions, 'admin');
}

// --- Firebase Admin Singleton ---
adminApp = initializeFirebaseAdmin();
adminAuth = getAdminAuth(adminApp);

// Export a getter function for the admin auth instance
export function getFirebaseAuth(): Auth {
    return adminAuth;
}

// Configure and export the Genkit AI instance.
export const ai = genkit({
  plugins: [
    googleAI({
      // IMPORTANT: This line is crucial to prevent authentication conflicts
      // between the Firebase Admin SDK and the Genkit Google AI plugin.
      firebaseAuth: 'DISABLED',
    }),
  ],
  enableTracingAndMetrics: false,
});
