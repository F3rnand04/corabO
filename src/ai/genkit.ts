'use server';

/**
 * @fileOverview Central Genkit initialization and Firebase Admin SDK setup.
 * This file is the single source of truth for the Genkit `ai` instance and
 * ensures Firebase Admin is initialized once for all server-side operations.
 */
import { genkit } from 'genkit';
import { firebase } from 'genkit/plugins/firebase';
import { googleAI } from '@genkit-ai/googleai';

// Firebase Admin is initialized in `src/lib/firebase-admin.ts`, which is imported
// by the server actions and flows. We don't need to initialize it again here.

// Initialize Genkit with necessary plugins
export const ai = genkit({
  plugins: [
    firebase(),
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
