
/**
 * @fileOverview Central Genkit initialization and Firebase Admin SDK setup.
 * This file is the single source of truth for the Genkit `ai` instance and
 * ensures Firebase Admin is initialized once for all server-side operations.
 */
import { genkit } from 'genkit';
import { firebase } from 'genkit/plugins/firebase';
// import { googleAI } from '@genkit-ai/googleai';
import { getFirebaseAuth } from '@/lib/firebase-admin';

// Initialize Firebase Admin SDK. This must be done once per server instance.
// The getFirebaseAuth function handles the singleton pattern.
getFirebaseAuth();

// Initialize Genkit with necessary plugins
export const ai = genkit({
  plugins: [
    firebase(),
    // googleAI({
    //   apiVersion: 'v1beta',
    // }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
