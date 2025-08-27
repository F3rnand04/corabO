
/**
 * @fileOverview Central Genkit initialization and Firebase Admin SDK setup.
 * This file is the single source of truth for the Genkit `ai` instance and
 * ensures Firebase Admin is initialized once for all server-side operations.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import {initializeApp, getApps, App, type AppOptions} from 'firebase-admin/app';
import { firebaseConfig } from '@/lib/firebase-config';

// This function ensures that Firebase Admin is initialized only once.
function initializeFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  
  // Explicitly provide the project configuration to the SDK.
  // This removes ambiguity and ensures the server authenticates with the correct project.
  const appOptions: AppOptions = {
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
  };

  return initializeApp(appOptions);
}

// Initialize Firebase Admin immediately when this file is imported.
initializeFirebaseAdmin();

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
