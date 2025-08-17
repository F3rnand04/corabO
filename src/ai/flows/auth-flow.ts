
'use server';
/**
 * @fileOverview Authentication flow for creating or retrieving a user.
 */

import { ai } from '@/ai/genkit';
import { getFirestoreDb } from '@/lib/firebase-server';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { z } from 'zod';
import { credicoraLevels } from '@/lib/types';
import { differenceInDays } from 'date-fns';


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
// We are explicitly NOT using the User type here to enforce serialization.
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
    const now = new Date();

    if (userDocSnap.exists()) {
      let user = userDocSnap.data() as User;
      const updates: Partial<User> = {};

      // Inactivity Logic: Pause account after 45 days.
      // The effectiveness penalty is now handled centrally in CoraboContext.
      if (user.lastActivityAt) {
          const daysSinceLastActivity = differenceInDays(now, new Date(user.lastActivityAt));
          if (daysSinceLastActivity >= 45 && !user.isPaused) {
              updates.isPaused = true;
          }
      }
      
      // Update last activity timestamp on every login
      updates.lastActivityAt = now.toISOString();

      // Ensure the specified user always has the admin role.
      if (user.email === 'fernandopbt@gmail.com' && user.role !== 'admin') {
        updates.role = 'admin';
      }
      
      // Apply updates if there are any
      if (Object.keys(updates).length > 0) {
        await updateDoc(userDocRef, updates, { merge: true });
        user = { ...user, ...updates }; // Update local user object
      }

      // Return a plain, serializable object
      return JSON.parse(JSON.stringify(user));
    } else {
      // Create a new, minimal user object.
      const initialCredicoraLevel = credicoraLevels['1'];
      const newUser: User = {
        id: firebaseUser.uid,
        coraboId: `${firebaseUser.displayName?.split(' ')[0].toLowerCase() || 'user'}${Math.floor(1000 + Math.random() * 9000)}`,
        name: firebaseUser.displayName || 'Nuevo Usuario',
        email: firebaseUser.email || '',
        profileImage: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
        createdAt: now.toISOString(),
        lastActivityAt: now.toISOString(), // Set initial activity
        isInitialSetupComplete: false, 
        lastName: '',
        idNumber: '',
        birthDate: '',
        country: '',
        type: 'client',
        reputation: 0,
        effectiveness: 100, // Start with 100% effectiveness
        phone: '',
        emailValidated: firebaseUser.emailVerified,
        phoneValidated: false,
        isGpsActive: true,
        credicoraLevel: initialCredicoraLevel.level,
        credicoraLimit: initialCredicoraLevel.creditLimit,
        credicoraDetails: initialCredicoraLevel,
        isSubscribed: false,
        isTransactionsActive: false,
        idVerificationStatus: 'rejected',
        profileSetupData: {
            location: "10.4806,-66.9036"
        },
      };

      if (newUser.email === 'fernandopbt@gmail.com') {
          newUser.role = 'admin';
      }

      await setDoc(userDocRef, newUser);
      // Return a plain, serializable object
      return JSON.parse(JSON.stringify(newUser));
    }
  }
);
