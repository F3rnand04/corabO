
/**
 * @fileOverview Central Genkit initialization.
 *
 * This file is now the single source of truth for the Genkit `ai` instance.
 * It is configured to be server-only and should not be imported directly
 * into any client components. Flows will import the `ai` object from here.
 */

import { configureGenkit } from 'genkit';
import { firebase } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';
import { ai } from '@genkit-ai/core';

// Initialize Firebase Admin SDK separately for server-side environments.
// This is crucial to avoid conflicts with Next.js server runtime.
import { getFirebaseAdmin } from '@/lib/firebase-server';
getFirebaseAdmin();


configureGenkit({
  plugins: [
    firebase,
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export { ai };
