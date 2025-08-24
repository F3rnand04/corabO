/**
 * @fileOverview Central Genkit initialization.
 *
 * This file is now the single source of truth for the Genkit `ai` instance.
 * It is configured to be server-only and should not be imported directly
 * into any client components. Flows will import the `ai` object from here.
 */

import { genkit } from 'genkit';
// The firebase() plugin is removed as we are now handling initialization globally in firebase-server.ts
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
