
'use server';
/**
 * @fileOverview Authentication flow for creating or retrieving a user.
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

export const getOrCreateUser = ai.defineFlow(
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

        if (userDocSnap.exists) {
            const user = userDocSnap.data() as User;
            const updates: { [key: string]: any } = {};
            
            // Update last activity timestamp on every login
            updates.lastActivityAt = now.toISOString();

            // Ensure the specified user always has the admin role.
            if (user.email === 'fernandopbt@gmail.com' && user.role !== 'admin') {
                updates.role = 'admin';
            }
            
            if (Object.keys(updates).length > 0) {
                await userDocRef.update(updates);
                // Return a serializable version of the updated user
                return JSON.parse(JSON.stringify({ ...user, ...updates }));
            }
            
            // Return the complete, serializable user object for existing users.
            return JSON.parse(JSON.stringify(user));
        } else {
            // Create a new, minimal user object.
            const initialCredicoraLevel = credicoraLevels['1'];
            const newUser: User = {
                id: firebaseUser.uid,
                coraboId: `${firebaseUser.displayName?.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}${Math.floor(1000 + Math.random() * 9000)}`,
                name: firebaseUser.displayName || '',
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
                reputation: 5,
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

            await userDocRef.set(newUser);
            // Return a plain, serializable object
            return JSON.parse(JSON.stringify(newUser));
        }
    } catch (error) {
        console.error("FATAL ERROR in getOrCreateUserFlow: ", error);
        // In case of a Firestore error, we must return null to prevent the app from crashing.
        // The context will handle this null value and keep the user logged out.
        return null;
    }
  }
);
