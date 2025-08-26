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
      enableTracingAndMetrics: false, // Explicitly disable tracing here
    }),
    googleAI(),
  ],
  enableTracingAndMetrics: false,
});
*/

// Genkit is temporarily disabled to resolve build issues.
export const ai: any = {
    defineFlow: (config: any, implementation: any) => implementation,
    defineTool: (config: any, implementation: any) => implementation,
    definePrompt: (config: any, implementation: any) => async () => ({ output: null }),
};
