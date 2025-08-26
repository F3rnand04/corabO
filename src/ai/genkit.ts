
/**
 * @fileOverview Central Genkit initialization.
 *
 * This file is now the single source of truth for the Genkit `ai` instance.
 * It is configured to be server-only and should not be imported directly
 * into any client components. Flows will import the `ai` object from here.
 */

import { genkit, ai } from '@genkit-ai/core';
import { firebase } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';

// This must be imported before initializing Genkit with Firebase.
import { getFirebaseAdmin } from '@/lib/firebase-server';
getFirebaseAdmin();


genkit({
  plugins: [
    firebase,
    googleAI(),
  ],
  enableTracingAndMetrics: true,
});

export { ai };
