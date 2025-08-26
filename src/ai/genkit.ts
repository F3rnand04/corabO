/**
 * @fileOverview Central Genkit initialization.
 * This file is the single source of truth for the Genkit `ai` instance.
 * It replaces the need for a separate firebase-server.ts file.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';

// By including the firebase() plugin here, Genkit handles the initialization
// of the Firebase Admin SDK for all backend operations, including functions
// and flows. This ensures a single, consistent initialization.
export const ai = genkit({
  plugins: [
    googleAI(),
    firebase(), // This plugin initializes Firebase Admin SDK
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: false,
});
