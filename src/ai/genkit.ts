/**
 * @fileOverview Central Genkit initialization.
 * This file is the single source of truth for the Genkit `ai` instance.
 */
import { getFirebaseAdmin } from '@/lib/firebase-server';

// This must be imported before initializing Genkit with Firebase.
// This call initializes the Firebase Admin SDK.
getFirebaseAdmin();


// Genkit is temporarily disabled to resolve build issues.
export const ai: any = {
    defineFlow: (config: any, implementation: any) => implementation,
    defineTool: (config: any, implementation: any) => implementation,
    definePrompt: (config: any, implementation: any) => async () => ({ output: null }),
};
