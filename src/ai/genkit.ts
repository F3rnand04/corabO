
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
  // By initializing without arguments in a Google Cloud environment (like App Hosting),
  // the SDK automatically uses the environment's default service account, which has the
  // necessary IAM permissions.
  return initializeApp();
}

// Initialize Firebase Admin immediately when this file is imported.
initializeFirebaseAdmin();

// Configure and export the Genkit AI instance.
export const ai = genkit({
  plugins: [
    googleAI({
      // THIS IS THE FIX:
      // It explicitly tells the Google AI plugin NOT to interfere with
      // Firebase's authentication, allowing the firebase-admin SDK to handle it
      // exclusively. This resolves the token refresh conflict.
      firebaseAuth: 'DISABLED',
    }),
  ],
  enableTracingAndMetrics: false,
});
