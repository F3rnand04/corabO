
/**
 * @fileOverview Central Genkit initialization.
 *
 * This file is now the single source of truth for the Genkit `ai` instance.
 * It is configured to be server-only and should not be imported directly
 * into any client components. Flows will import the `ai` object from here.
 */

import { genkit } from 'genkit';
import { firebase } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    firebase(),
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
