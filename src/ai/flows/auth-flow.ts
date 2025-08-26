
'use server';
/**
 * @fileOverview Authentication flow for creating and managing users.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import type { FirebaseUserInput, User } from '@/lib/types';


export const getOrCreateUser = ai.defineFlow(
  {
    name: 'getOrCreateUserFlow',
    inputSchema: z.any(),
    outputSchema: z.any().nullable(),
  },
  async (firebaseUser: FirebaseUserInput) => {
    const db = getFirestore();
    const userRef = db.collection('users').doc(firebaseUser.uid);
    const userSnap = await userRef.get();

    if (userSnap.exists()) {
      return userSnap.data() as User;
    }

    // User does not exist, create a new one.
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
      emailValidated: firebaseUser.emailVerified,
      phoneValidated: false,
      isInitialSetupComplete: false,
      createdAt: new Date().toISOString(),
    };

    await userRef.set(newUser);
    return newUser;
  }
);
