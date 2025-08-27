
/**
 * @fileOverview Central Genkit initialization and Firebase Admin SDK setup.
 * This file is the single source of truth for the Genkit `ai` instance and
 * ensures Firebase Admin is initialized once for all server-side operations.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import {initializeApp, getApps, App} from 'firebase-admin/app';

// This function ensures that Firebase Admin is initialized only once.
function initializeFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  // Environment variables for Firebase config are automatically read by
  // the Firebase Admin SDK in many environments (like Cloud Functions, App Engine).
  // If running locally, you'd need a service account file set via GOOGLE_APPLICATION_CREDENTIALS.
  return initializeApp();
}

// Initialize Firebase Admin immediately.
initializeFirebaseAdmin();

// Configure and export the Genkit AI instance.
export const ai = genkit({
  plugins: [
    googleAI(),
    // The @genkit-ai/firebase plugin is removed. Initialization is now handled above.
  ],
  enableTracingAndMetrics: false,
});
