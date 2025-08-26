'use server';
/**
 * @fileOverview Central Genkit initialization.
 * This file is the single source of truth for the Genkit `ai` instance.
 */
/*
import { genkit } from 'genkit';
import { firebase } from '@genkit-ai/firebase/plugin';
import { googleAI } from '@genkit-ai/googleai';
import { getFirebaseAdmin } from '@/lib/firebase-server';

// This must be imported before initializing Genkit with Firebase.
getFirebaseAdmin();


export const ai = genkit({
  plugins: [
    firebase({
      firestore: {
        useGoogleCloudProject: true,
      },
    }),
    googleAI(),
  ],
  enableTracingAndMetrics: false,
});
*/
export const ai: any = {}; // Placeholder to avoid breaking imports
