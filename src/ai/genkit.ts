/**
 * @fileOverview Central Genkit initialization.
 * This file is the single source of truth for the Genkit `ai` instance.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// IMPORTANT: The firebase() plugin has been removed to resolve a critical
// server-side authentication issue where multiple initializations were
// conflicting. The application will now rely on a single, manual Firebase
// Admin SDK initialization managed by `firebase-server.ts`.
export const ai = genkit({
  plugins: [
    googleAI(),
    // firebase(), // DO NOT RE-ENABLE THIS.
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: false,
});
