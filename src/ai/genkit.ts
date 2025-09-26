'use server';

/**
 * @fileOverview Central Genkit initialization and Firebase Admin SDK setup.
 * This file is the single source of truth for the Genkit `ai` instance and
 * ensures Firebase Admin is initialized once for all server-side operations.
 */
import { genkit } from 'genkit';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';

// Firebase Admin is initialized in `src/lib/firebase-admin.ts`.
// The new @genkit-ai/firebase library uses a direct initialization function
// for telemetry instead of a plugin.

enableFirebaseTelemetry();

// Initialize Genkit with necessary plugins
export const ai = genkit({
  plugins: [
    // The Firebase plugin is deprecated. Telemetry is enabled above.
    // Firestore access is handled directly via the Admin SDK passed to flows.
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
});
