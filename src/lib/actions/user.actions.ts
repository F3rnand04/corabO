'use server';

import { getFirebaseAdmin } from '@/lib/firebase-server';
getFirebaseAdmin(); // Ensure Firebase is initialized

import { revalidatePath } from 'next/cache';
import type { FirebaseUserInput, ProfileSetupData, User, VerificationOutput } from '@/lib/types';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getOrCreateUserFlow } from '@/ai/flows/auth-flow';
import { credicoraCompanyLevels, credicoraLevels } from '@/lib/types';

const sendSmsVerificationCodeFlow = async (data: any) => console.warn("Genkit flow 'sendSmsVerificationCodeFlow' is disabled.");
const verifySmsCodeFlow = async (data: any) => { console.warn("Genkit flow 'verifySmsCodeFlow' is disabled."); return { success: false, message: 'Flow disabled' }; };
const autoVerifyIdWithAIFlow = async (data: any) => { console.warn("Genkit flow 'autoVerifyIdWithAIFlow' is disabled."); return { nameMatch: false, idMatch: false, extractedId: '', extractedName: '' }; };
const sendWelcomeToProviderNotificationFlow = async (data: any) => console.warn("Genkit flow 'sendWelcomeToProviderNotificationFlow' is disabled.");
const createTransactionFlow = async (data: any) => console.warn("Genkit flow 'createTransactionFlow' is disabled.");
const checkIdUniquenessFlow = async (data: any) => { console.warn("Genkit flow 'checkIdUniquenessFlow' is disabled."); return true;};


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
    const updates = { 'profileSetupData': formData, 'isTransactionsActive': true, 'type': userType };
    await updateUser(userId, updates);
    if(userType === 'provider' || userType === 'repartidor') {
        await sendWelcomeToProviderNotificationFlow({ userId });
    }
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
    return await checkIdUniquenessFlow(input);
}

export async function completeInitialSetup(userId: string, data: { name: string; lastName: string; idNumber: string; birthDate: string; country: string; type: User['type'], providerType: ProfileSetupData['providerType'] }): Promise<User | null> {
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
    return updatedUserDoc.data() as User;
}

export async function sendSmsVerification(userId: string, phoneNumber: string) {
    await sendSmsVerificationCodeFlow({ userId, phoneNumber });
}

export async function verifySmsCode(userId: string, code: string): Promise<{ success: boolean; message: string; }> {
    const result = await verifySmsCodeFlow({ userId, code });
    if(result.success) {
        revalidatePath('/contacts');
    }
    return result;
}

export async function autoVerifyIdWithAI(user: User): Promise<VerificationOutput | { error: string }> {
    if (!user.idDocumentUrl || !user.name || !user.idNumber) {
        return { error: "Missing required user data for verification." };
    }
    const result = await autoVerifyIdWithAIFlow({
        userId: user.id,
        nameInRecord: `${user.name} ${user.lastName || ''}`.trim(),
        idInRecord: user.idNumber,
        documentImageUrl: user.idDocumentUrl,
        isCompany: user.profileSetupData?.providerType === 'company',
    });
    return result;
}

export async function subscribeUser(userId: string, planName: string, amount: number) {
    await createTransactionFlow({
        type: 'Sistema', status: 'Finalizado - Pendiente de Pago',
        date: new Date().toISOString(), amount: amount, clientId: userId,
        providerId: 'corabo-admin', participantIds: [userId, 'corabo-admin'],
        details: { system: `Suscripción: ${planName}`, isSubscription: true }
    });
    revalidatePath('/transactions');
    revalidatePath('/payment', 'layout');
}

export async function deactivateTransactions(userId: string) {
    await updateUser(userId, { isTransactionsActive: false });
    revalidatePath('/transactions/settings');
    revalidatePath('/profile');
}
