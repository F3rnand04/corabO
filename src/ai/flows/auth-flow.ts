
'use server';

/**
 * @fileOverview Authentication flow for creating and managing users.
 */
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { FirebaseUserInput, User, ProfileSetupData } from '@/lib/types';
import { credicoraLevels, credicoraCompanyLevels } from '@/lib/types';


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
