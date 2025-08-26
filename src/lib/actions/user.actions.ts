'use server';

/*
import { 
    getOrCreateUser, 
    updateUserFlow, 
    toggleGpsFlow,
    deleteUserFlow,
    checkIdUniquenessFlow,
    completeInitialSetupFlow,
} from '@/ai/flows/profile-flow';
import { sendSmsVerificationCodeFlow, verifySmsCodeFlow } from '@/ai/flows/sms-flow';
import { autoVerifyIdWithAIFlow } from '@/ai/flows/verification-flow';
import { sendWelcomeToProviderNotificationFlow } from '@/ai/flows/notification-flow';
import { createTransactionFlow } from '@/ai/flows/transaction-flow';
*/
import { revalidatePath } from 'next/cache';
import type { FirebaseUserInput, ProfileSetupData, User, VerificationOutput } from '@/lib/types';
import { getFirestore } from 'firebase-admin/firestore';
import { addMinutes, isAfter } from 'date-fns';

// --- Re-implemented flows as local functions ---

async function getOrCreateUser(firebaseUser: FirebaseUserInput): Promise<User> {
    const db = getFirestore();
    const userRef = db.collection('users').doc(firebaseUser.uid);
    const userSnap = await userRef.get();
    if (userSnap.exists()) return userSnap.data() as User;
    const coraboId = `corabo${Math.floor(Math.random() * 9000) + 1000}`;
    const newUser: User = {
      id: firebaseUser.uid, coraboId,
      name: firebaseUser.displayName || 'Invitado', lastName: '',
      email: firebaseUser.email || `${coraboId}@corabo.app`,
      profileImage: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
      phone: firebaseUser.phoneNumber || '', type: 'client', reputation: 5, effectiveness: 100,
      isGpsActive: true, emailValidated: firebaseUser.emailVerified || false, phoneValidated: false,
      isInitialSetupComplete: false, createdAt: new Date().toISOString(),
    };
    await userRef.set(newUser);
    revalidatePath('/');
    return newUser;
}

async function updateUserFlow({ userId, updates }: { userId: string; updates: any; }) {
    const db = getFirestore();
    await db.collection('users').doc(userId).update(updates);
}

async function completeInitialSetupFlow(input: any): Promise<User | null> {
    const { userId, ...data } = input;
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const updates = { ...data, isInitialSetupComplete: true };
    await userRef.update(updates);
    const updatedUserDoc = await userRef.get();
    return updatedUserDoc.data() as User;
}

// --- Placeholder flows ---
const sendSmsVerificationCodeFlow = async (data: any) => console.warn("Genkit flow 'sendSmsVerificationCodeFlow' is disabled.");
const verifySmsCodeFlow = async (data: any) => { console.warn("Genkit flow 'verifySmsCodeFlow' is disabled."); return { success: false, message: 'Flow disabled' }; };
const autoVerifyIdWithAIFlow = async (data: any) => { console.warn("Genkit flow 'autoVerifyIdWithAIFlow' is disabled."); return { nameMatch: false, idMatch: false, extractedId: '', extractedName: '' }; };
const sendWelcomeToProviderNotificationFlow = async (data: any) => console.warn("Genkit flow 'sendWelcomeToProviderNotificationFlow' is disabled.");
const createTransactionFlow = async (data: any) => console.warn("Genkit flow 'createTransactionFlow' is disabled.");
const checkIdUniquenessFlow = async (data: any) => { console.warn("Genkit flow 'checkIdUniquenessFlow' is disabled."); return true; };
const deleteUserFlow = async (data: any) => console.warn("Genkit flow 'deleteUserFlow' is disabled.");
const toggleGpsFlow = async (data: any) => console.warn("Genkit flow 'toggleGpsFlow' is disabled.");


// --- Exported Actions ---

export { getOrCreateUser };

export async function updateUser(userId: string, updates: Partial<User> | { [key: string]: any }) {
    await updateUserFlow({ userId, updates });
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function updateUserProfileImage(userId: string, dataUrl: string) {
    await updateUserFlow({ userId, updates: { profileImage: dataUrl }});
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function updateFullProfile(userId: string, formData: ProfileSetupData, userType: User['type']) {
    const updates = { 'profileSetupData': formData, 'isTransactionsActive': true, 'type': userType };
    await updateUserFlow({ userId, updates });
    if(userType === 'provider' || userType === 'repartidor') {
        await sendWelcomeToProviderNotificationFlow({ userId });
    }
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}


export async function toggleGps(userId: string) {
    await toggleGpsFlow({ userId });
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function deleteUser(userId: string) {
    await deleteUserFlow({ userId });
    revalidatePath('/admin');
}

export async function checkIdUniqueness(input: { idNumber: string; country: string; currentUserId: string; }): Promise<boolean> {
    return await checkIdUniquenessFlow(input);
}

export async function completeInitialSetup(userId: string, data: { name: string; lastName: string; idNumber: string; birthDate: string; country: string; type: User['type'], providerType: ProfileSetupData['providerType'] }): Promise<User | null> {
    const user = await completeInitialSetupFlow({ userId, ...data });
    revalidatePath('/');
    return user;
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
    await updateUserFlow({ userId, updates: { isTransactionsActive: false } });
    revalidatePath('/transactions/settings');
    revalidatePath('/profile');
}