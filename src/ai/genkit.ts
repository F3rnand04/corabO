/**
 * @fileOverview Central Genkit initialization.
 * This file is the single source of truth for the Genkit `ai` instance.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';

// IMPORTANT: The manual getFirebaseAdmin() call is REMOVED.
// Genkit's firebase() plugin will now handle the initialization.

export const ai = genkit({
  plugins: [
    googleAI(),
    firebase(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: false,
});
