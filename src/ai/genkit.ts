/**
 * @fileOverview Central Genkit initialization.
 * This file is the single source of truth for the Genkit `ai` instance.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase/plugin';
import {getFirebaseAdmin} from '@/lib/firebase-server';

// Initialize Firebase Admin SDK. This MUST be called before initializing Genkit
// to ensure the Firebase app is ready for the Genkit plugin.
getFirebaseAdmin();

// Genkit initialization with the Firebase plugin enabled.
// This is now the single source of truth for server-side Firebase services.
export const ai = genkit({
  plugins: [
    googleAI(),
    firebase(), // This plugin manages authentication and access for flows.
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: false,
});
