/**
 * @fileOverview Central Genkit initialization.
 * This file is the single source of truth for the Genkit `ai` instance.
 */
import {getFirebaseAdmin} from '@/lib/firebase-server';
// import {genkit} from 'genkit';
// import {googleAI} from '@genkit-ai/googleai';
// import {firebase} from '@genkit-ai/firebase/plugin';

// Initialize Firebase Admin SDK
getFirebaseAdmin();

// AI functionality is temporarily disabled to ensure application stability.
// The AI object is defined as a placeholder to prevent reference errors.
export const ai: any = {};
