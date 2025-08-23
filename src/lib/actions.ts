
'use server';
/**
 * @fileOverview Server Actions for the Corabo application.
 * This file serves as the primary bridge between client-side components and server-side Genkit flows.
 * All functions exported from this file are marked as server actions and will only execute on the server.
 */

// FLOW IMPORTS
import {
  getOrCreateUserFlow,
} from '@/ai/flows/auth-flow';

import type { FirebaseUserInput } from '@/ai/flows/auth-flow';

// ACTION WRAPPERS

/**
 * Gets or creates a user in Firestore based on the Firebase Auth user.
 * @param firebaseUser The user object from Firebase Auth.
 * @returns The full Corabo user profile.
 */
export async function getOrCreateUser(firebaseUser: FirebaseUserInput) {
  return await getOrCreateUserFlow(firebaseUser);
}

// NOTE: Other actions will be added back progressively once the login flow is stable.
