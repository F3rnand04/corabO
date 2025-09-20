/**
 * @fileOverview Flows for fetching profile-specific data securely with pagination.
 */
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { User, ProfileSetupData, FirebaseUserInput } from '@/lib/types';
import { z } from 'zod';


// --- Update User Flow ---
export async function updateUserFlow(input: { userId: string, updates: any }) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    await userRef.update(input.updates);
}

// --- Toggle GPS Flow ---
export async function toggleGpsFlow(input: { userId: string }) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
        const currentStatus = (userSnap.data() as User).isGpsActive;
        await userRef.update({ isGpsActive: !currentStatus });
    }
}


// --- Delete User Flow ---
export async function deleteUserFlow(input: { userId: string }) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    await userRef.delete();
}

// --- Check ID Uniqueness Flow ---
export async function checkIdUniquenessFlow(input: { idNumber: string; country: string; currentUserId: string; }): Promise<boolean> {
    if (!input.idNumber || !input.country) {
      return true; // Don't run check if data is incomplete
    }
    const db = getFirestore();
    const usersRef = db.collection('users');
    const q = usersRef.where("idNumber", "==", input.idNumber).where("country", "==", input.country);
    const querySnapshot = await q.get();
    
    if (querySnapshot.empty) {
      return true; // ID is unique
    }

    const isOwnDocument = querySnapshot.docs[0].id === input.currentUserId;
    return isOwnDocument;
}
