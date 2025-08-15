
'use server';
/**
 * @fileOverview Authentication flow for creating or retrieving a user.
 */

import { ai } from '@/ai/genkit';
import { getFirestoreDb } from '@/lib/firebase-server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { z } from 'zod';


// Schema for the user object we expect from the client (FirebaseUser)
const FirebaseUserSchema = z.object({
  uid: z.string(),
  displayName: z.string().nullable(),
  email: z.string().nullable(),
  photoURL: z.string().nullable(),
  emailVerified: z.boolean(),
});
export type FirebaseUserInput = z.infer<typeof FirebaseUserSchema>;

// Schema for the User object we return - can be a User object or null
const UserOutputSchema = z.any().nullable();


export const getOrCreateUser = ai.defineFlow(
  {
    name: 'getOrCreateUserFlow',
    inputSchema: FirebaseUserSchema,
    outputSchema: UserOutputSchema,
  },
  async (firebaseUser) => {
    const db = getFirestoreDb();
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const user = userDocSnap.data() as User;
      // Ensure the specified user always has the admin role.
      if (user.email === 'fernandopbt@gmail.com' && user.role !== 'admin') {
        user.role = 'admin';
        await setDoc(userDocRef, user, { merge: true });
      }
      return user;
    } else {
      const name = ''; // Let user input their name on setup
      const firstName = "USER";

      const coraboId = (firstName.substring(0, 3)).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
       
       const newUser: User = {
         id: firebaseUser.uid,
         coraboId: coraboId,
         name: name, // Intentionally left blank for user input
         lastName: '', // Intentionally left blank for user input
         idNumber: '',
         birthDate: '',
         country: '',
         createdAt: new Date().toISOString(),
         type: 'client',
         reputation: 0,
         effectiveness: 0,
         profileImage: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
         email: firebaseUser.email || '',
         phone: '',
         emailValidated: firebaseUser.emailVerified,
         phoneValidated: false,
         isGpsActive: true,
         isInitialSetupComplete: false,
         credicoraLevel: 1,
         credicoraLimit: 150,
         profileSetupData: {
             location: "10.4806,-66.9036"
         },
         isSubscribed: false,
         isTransactionsActive: false,
         idVerificationStatus: 'rejected',
       };
       
       if (newUser.email === 'fernandopbt@gmail.com') {
           newUser.role = 'admin';
       }

       await setDoc(userDocRef, newUser);
       return newUser;
    }
  }
);
