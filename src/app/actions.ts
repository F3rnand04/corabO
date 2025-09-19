'use server';

import '@/ai/genkit';
import { getFirestore } from 'firebase-admin/firestore';
import type { FirebaseUserInput, User } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getOrCreateUserFlow } from '@/ai/flows/auth-flow';

/**
 * Gets a user document from Firestore, or creates it if it doesn't exist.
 * This server action now correctly wraps the centralized Genkit flow.
 */
export async function getOrCreateUser(firebaseUser: FirebaseUserInput): Promise<User> {
    const user = await getOrCreateUserFlow(firebaseUser);
    revalidatePath('/'); // Revalidate the path to reflect changes
    return user;
}
