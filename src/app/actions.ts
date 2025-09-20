'use server';

import { getFirestore } from 'firebase-admin/firestore';
import type { FirebaseUserInput, User } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getFirebaseAuth } from '@/lib/firebase-admin';

/**
 * Gets a user document from Firestore, or creates it if it doesn't exist.
 * This is a Server Action and executes only on the server.
 */
export async function getOrCreateUser(firebaseUser: FirebaseUserInput): Promise<User> {
    const db = getFirestore();
    const userRef = db.collection('users').doc(firebaseUser.uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      revalidatePath('/'); // Ensure any updates are reflected
      return userSnap.data() as User;
    }

    // If user does not exist, create a new document.
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
      // Ensure required fields that might be null on firebaseUser are handled
      emailValidated: firebaseUser.emailVerified ?? false,
    };

    await userRef.set(newUser);
    
    // Set custom claims for security rules if needed (e.g., initial role)
    const auth = getFirebaseAuth();
    await auth.setCustomUserClaims(firebaseUser.uid, { role: 'client' });

    revalidatePath('/'); // Revalidate the path to reflect the new user
    return newUser;
}
