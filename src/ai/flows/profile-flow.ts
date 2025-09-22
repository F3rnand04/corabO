'use server';
/**
 * @fileOverview Flows for fetching and managing user profile data.
 */
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { User, ProfileSetupData, FirebaseUserInput } from '@/lib/types';
import { credicoraLevels, credicoraCompanyLevels } from '@/lib/data/options';


// --- Flows for User Profile Management ---

export async function getOrCreateUserFlow(firebaseUser: FirebaseUserInput): Promise<User> {
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
    return newUser;
}


export async function completeInitialSetupFlow(userId: string, data: { name: string; lastName: string; idNumber: string; birthDate: string; country: string; type: User['type'], providerType: ProfileSetupData['providerType'] }): Promise<User> {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new Error("User not found during setup completion.");
    }
    const existingData = userSnap.data() as User;
    
    const isCompany = data.providerType === 'company';
    const activeCredicoraLevels = isCompany ? credicoraCompanyLevels : credicoraLevels;
    const initialCredicoraLevel = activeCredicoraLevels['1'];
    
    const dataToUpdate: Partial<User> = {
      name: data.name,
      lastName: data.lastName,
      idNumber: data.idNumber,
      birthDate: data.birthDate,
      country: data.country,
      isInitialSetupComplete: true,
      type: isCompany ? 'provider' : data.type, // If it's a company, force the type to 'provider'.
      credicoraLevel: initialCredicoraLevel.level,
      credicoraLimit: initialCredicoraLevel.creditLimit,
      credicoraDetails: initialCredicoraLevel,
      profileSetupData: {
        ...(existingData.profileSetupData || {}),
        providerType: data.providerType,
      }
    };

    await userRef.update(dataToUpdate);

    const updatedUserDoc = await userRef.get();
    return updatedUserDoc.data() as User;
}

export async function updateUserFlow(input: { userId: string, updates: any }) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    await userRef.update(input.updates);
}

export async function toggleGpsFlow(input: { userId: string }) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
        const currentStatus = (userSnap.data() as User).isGpsActive;
        await userRef.update({ isGpsActive: !currentStatus });
    }
}

export async function deleteUserFlow(input: { userId: string }) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(input.userId);
    await userRef.delete();
}

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

export async function addContactToUserFlow(userId: string, contactId: string) {
    const db = getFirestore();
    await db.collection('users').doc(userId).update({
        contacts: FieldValue.arrayUnion(contactId)
    });
}

export async function removeContactFromUserFlow(userId: string, contactId: string) {
    const db = getFirestore();
    await db.collection('users').doc(userId).update({
        contacts: FieldValue.arrayRemove(contactId)
    });
}

  