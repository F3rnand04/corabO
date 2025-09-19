'use server';

import { getFirebaseAuth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import type { FirebaseUserInput, User } from '@/lib/types';
import { revalidatePath } from 'next/cache';

/**
 * Gets a user document from Firestore, or creates it if it doesn't exist.
 * This is a server action to be called from server components.
 */
export async function getOrCreateUser(firebaseUser: FirebaseUserInput): Promise<User> {
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
    revalidatePath('/'); // Revalidate the path to reflect changes
    return newUser;
}
