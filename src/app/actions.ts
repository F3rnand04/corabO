
'use server';

import '@/ai/genkit';
import { getFirestore } from 'firebase-admin/firestore';
import type { FirebaseUserInput, User } from '@/lib/types';
import { revalidatePath } from 'next/cache';
// import { getOrCreateUserFlow } from '@/ai/flows/auth-flow';

/**
 * Gets a user document from Firestore, or creates it if it doesn't exist.
 * This server action now correctly wraps the centralized Genkit flow.
 */
export async function getOrCreateUser(firebaseUser: FirebaseUserInput): Promise<User> {
    // const user = await getOrCreateUserFlow(firebaseUser);
    
    // START TEMPORARY MOCK
    const db = getFirestore();
    const userRef = db.collection('users').doc(firebaseUser.uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      return userSnap.data() as User;
    }

    const coraboId = `corabo${Math.floor(Math.random() * 9000) + 1000}`;
    
    const newUser: User = {
      id: firebaseUser.uid,
      coraboId: coraboId,
      name: firebaseUser.displayName || 'Invitado',
      lastName: '',
      email: firebaseUser.email || `${coraboId}@corabo.app`,
      profileImage: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
      phone: firebaseUser.phoneNumber || '',
      type: 'client',
      reputation: 5,
      effectiveness: 100,
      isGpsActive: true,
      emailValidated: firebaseUser.emailVerified || false,
      phoneValidated: false,
      isInitialSetupComplete: false,
      createdAt: new Date().toISOString(),
    };

    await userRef.set(newUser);
    const user = newUser;
    // END TEMPORARY MOCK

    revalidatePath('/'); // Revalidate the path to reflect changes
    return user;
}
