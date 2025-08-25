
'use server';
/**
 * @fileOverview Authentication flow for creating or retrieving a user.
 * This flow is now corrected to exclusively use the Firebase Admin SDK for all database operations
 * and ensures the returned object is properly JSON-serializable.
 */

import { ai } from '@/ai/genkit';
import { getFirestore } from 'firebase-admin/firestore';
import type { User } from '@/lib/types';
import { z } from 'zod';
import { credicoraLevels } from '@/lib/types';

// Schema for the user object we expect from the client (FirebaseUser)
const FirebaseUserSchema = z.object({
  uid: z.string(),
  displayName: z.string().nullable(),
  email: z.string().nullable(),
  photoURL: z.string().nullable(),
  emailVerified: z.boolean(),
});
export type FirebaseUserInput = z.infer<typeof FirebaseUserSchema>;

// The output MUST be a plain JSON-serializable object.
const UserOutputSchema = z.any().nullable();

export const getOrCreateUserFlow = ai.defineFlow(
  {
    name: 'getOrCreateUserFlow',
    inputSchema: FirebaseUserSchema,
    outputSchema: UserOutputSchema,
  },
  async (firebaseUser) => {
    const db = getFirestore();
    const userDocRef = db.collection('users').doc(firebaseUser.uid);
    const now = new Date();

    try {
      const userDocSnap = await userDocRef.get();

      if (userDocSnap.exists()) {
        const user = userDocSnap.data() as User;
        // Return the complete, serializable user object for existing users.
        return JSON.parse(JSON.stringify(user));
      } else {
        // Create a new, minimal user object.
        const newUser: User = {
          id: firebaseUser.uid,
          coraboId: `${firebaseUser.displayName?.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}${Math.floor(1000 + Math.random() * 9000)}`,
          name: firebaseUser.displayName || 'Nuevo Usuario',
          email: firebaseUser.email || '',
          profileImage:
            firebaseUser.photoURL ||
            `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
          createdAt: now.toISOString(),
          lastActivityAt: now.toISOString(),
          isInitialSetupComplete: false, // CRITICAL FIX: This must be false for new users.
          lastName: '',
          idNumber: '',
          birthDate: '',
          country: '',
          type: 'client',
          reputation: 5,
          effectiveness: 100,
          phone: '',
          emailValidated: firebaseUser.emailVerified,
          phoneValidated: false,
          isGpsActive: true,
          isSubscribed: false,
          isTransactionsActive: false,
          idVerificationStatus: 'rejected',
          profileSetupData: {
            location: '10.4806,-66.9036',
          },
        };

        // Assign admin role if the email matches
        if (newUser.email === 'fernandopbt@gmail.com') {
          newUser.role = 'admin';
        }

        await userDocRef.set(newUser);
        // Return a plain, serializable object to prevent hydration issues
        return JSON.parse(JSON.stringify(newUser));
      }
    } catch (error) {
      console.error('FATAL ERROR in getOrCreateUserFlow: ', error);
      // In case of a Firestore error, we must return null to prevent the app from crashing.
      return null;
    }
  }
);
