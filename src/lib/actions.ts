
'use server';
/**
 * @fileOverview Server Actions for the Corabo application.
 * This file serves as the PRIMARY and SOLE bridge between client-side components and server-side Genkit flows.
 * All functions exported from this file are marked as server actions and will only execute on the server.
 * Client components should ONLY import from this file to interact with the backend.
 */

import { getFirestore, doc, updateDoc, writeBatch, getDoc, FieldValue, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase-admin/firestore';
import { getOrCreateUserFlow, FirebaseUserInput } from '@/ai/flows/auth-flow';
import type { User, ProfileSetupData } from './types';


// =================================
// AUTH FLOWS
// =================================
export async function getOrCreateUser(firebaseUser: FirebaseUserInput) {
  return await getOrCreateUserFlow(firebaseUser);
}


// Placeholder for other actions to be added in future phases
// Example:
// export async function someOtherAction(data: any) {
//   // return await someOtherFlow(data);
// }
