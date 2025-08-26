'use server';
/**
 * @fileOverview Central Genkit initialization.
 * This file is the single source of truth for the Genkit `ai` instance.
 */

import { genkit, configureGenkit } from '@genkit-ai/core';
import { firebase } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';

// This must be imported before initializing Genkit with Firebase.
import { getFirebaseAdmin } from '@/lib/firebase-server';
getFirebaseAdmin();


configureGenkit({
  plugins: [
    firebase,
    googleAI(),
  ],
  enableTracingAndMetrics: false,
});

export { genkit as ai };
