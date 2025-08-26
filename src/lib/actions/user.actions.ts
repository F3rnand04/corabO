'use server';

import { getFirebaseAdmin } from '@/lib/firebase-server';
getFirebaseAdmin(); // Ensure Firebase is initialized

import { revalidatePath } from 'next/cache';
import type { FirebaseUserInput, ProfileSetupData, User } from '@/lib/types';
import { getFirestore } from 'firebase-admin/firestore';
import { getOrCreateUserFlow } from '@/ai/flows/auth-flow';
import { credicoraCompanyLevels, credicoraLevels } from '@/lib/types';


// --- Exported Actions ---

export async function getOrCreateUser(firebaseUser: FirebaseUserInput): Promise<User> {
    const user = await getOrCreateUserFlow(firebaseUser);
    revalidatePath('/'); 
    return user;
}

export async function updateUser(userId: string, updates: Partial<User> | { [key: string]: any }) {
    const db = getFirestore();
    await db.collection('users').doc(userId).update(updates);
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function updateUserProfileImage(userId: string, dataUrl: string) {
    await updateUser(userId, { profileImage: dataUrl });
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function updateFullProfile(userId: string, formData: ProfileSetupData, userType: User['type']) {
    // Placeholder function, logic is not implemented as Genkit is disabled.
    console.log("updateFullProfile action called, but Genkit is disabled.");
    // In a real scenario, this would likely call a Genkit flow.
    // For now, let's just update the user with the provided data.
     await updateUser(userId, { 
        'profileSetupData': formData, 
        'isTransactionsActive': true, 
        'type': userType 
    });
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}


export async function toggleGps(userId: string) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
        const currentStatus = (userSnap.data() as User).isGpsActive;
        await userRef.update({ isGpsActive: !currentStatus });
    }
    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function deleteUser(userId: string) {
    const db = getFirestore();
    await db.collection('users').doc(userId).delete();
    revalidatePath('/admin');
}

export async function checkIdUniqueness(input: { idNumber: string; country: string; currentUserId: string; }): Promise<boolean> {
    // Placeholder function, logic is not implemented as Genkit is disabled.
    console.warn("checkIdUniqueness action called, but Genkit is disabled.");
    return true; // Assume unique for now
}

export async function completeInitialSetup(userId: string, data: { name: string; lastName: string; idNumber: string; birthDate: string; country: string; type: User['type'], providerType: ProfileSetupData['providerType'] }): Promise<User> {
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
      type: isCompany ? 'provider' : data.type,
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
    revalidatePath('/'); // Revalidate the home page to reflect login status
    return updatedUserDoc.data() as User;
}

export async function sendSmsVerification(userId: string, phoneNumber: string) {
    // Placeholder function, logic is not implemented as Genkit is disabled.
    console.warn("sendSmsVerification action called, but Genkit is disabled.");
}

export async function verifySmsCode(userId: string, code: string): Promise<{ success: boolean; message: string; }> {
    // Placeholder function, logic is not implemented as Genkit is disabled.
    console.warn("verifySmsCode action called, but Genkit is disabled.");
    return { success: false, message: "Verification flow is disabled." };
}

export async function autoVerifyIdWithAI(user: User): Promise<any> {
    // Placeholder function, logic is not implemented as Genkit is disabled.
    console.warn("autoVerifyIdWithAI action called, but Genkit is disabled.");
    return { error: "AI Verification is disabled." };
}

export async function subscribeUser(userId: string, planName: string, amount: number) {
    // Placeholder function, logic is not implemented as Genkit is disabled.
    console.warn("subscribeUser action called, but Genkit is disabled.");
}

export async function deactivateTransactions(userId: string) {
    await updateUser(userId, { isTransactionsActive: false });
    revalidatePath('/transactions/settings');
    revalidatePath('/profile');
}
