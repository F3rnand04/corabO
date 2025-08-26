/**
 * @fileOverview Authentication flow for creating and managing users.
 */

// import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import type { FirebaseUserInput, User } from '@/lib/types';


export async function getOrCreateUserFlow(firebaseUser: FirebaseUserInput): Promise<User> {
    console.warn("Genkit flow 'getOrCreateUserFlow' is disabled. Using direct DB access.");
    const db = getFirestore();
    const userRef = db.collection('users').doc(firebaseUser.uid);
    const userSnap = await userRef.get();

    if (userSnap.exists()) {
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
    return newUser;
}
