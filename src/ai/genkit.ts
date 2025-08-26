'use server';
/**
 * @fileOverview Central Genkit initialization.
 * This file is the single source of truth for the Genkit `ai` instance.
 */
import { genkit } from 'genkit';
import { firebase } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';

// This must be imported before initializing Genkit with Firebase.
import { getFirebaseAdmin } from '@/lib/firebase-server';
getFirebaseAdmin();


// export const ai = genkit({
//   plugins: [
//     firebase(),
//     googleAI(),
//   ],
//   enableTracingAndMetrics: false,
// });

// Placeholder export to avoid breaking other files during diagnosis
export const ai = {};
