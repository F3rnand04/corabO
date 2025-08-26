'use server';

import { getFirebaseAdmin } from '@/lib/firebase-server';
getFirebaseAdmin(); // Ensure Firebase is initialized

import { revalidatePath } from 'next/cache';
import type { FirebaseUserInput, ProfileSetupData, User, VerificationOutput } from '@/lib/types';

// Correctly importing the single flow from the refactored auth-flow
import { getOrCreateUserFlow } from '@/ai/flows/auth-flow'; 

// Removed the direct DB logic from here to respect the architecture.
// Flows that are not being used immediately are commented out to prevent compilation errors.
import { 
    // getOrCreateUserFlow, 
    completeInitialSetupFlow, 
    checkIdUniquenessFlow, 
    updateUserFlow,
    toggleGpsFlow,
    deleteUserFlow
} from '@/ai/flows/profile-flow';

// --- Placeholder flows ---
const sendSmsVerificationCodeFlow = async (data: any) => console.warn("Genkit flow 'sendSmsVerificationCodeFlow' is disabled.");
const verifySmsCodeFlow = async (data: any) => { console.warn("Genkit flow 'verifySmsCodeFlow' is disabled."); return { success: false, message: 'Flow disabled' }; };
const autoVerifyIdWithAIFlow = async (data: any) => { console.warn("Genkit flow 'autoVerifyIdWithAIFlow' is disabled."); return { nameMatch: false, idMatch: false, extractedId: '', extractedName: '' }; };
const sendWelcomeToProviderNotificationFlow = async (data: any) => console.warn("Genkit flow 'sendWelcomeToProviderNotificationFlow' is disabled.");
const createTransactionFlow = async (data: any) => console.warn("Genkit flow 'createTransactionFlow' is disabled.");


// --- Exported Actions ---

export async function getOrCreateUser(firebaseUser: FirebaseUserInput): Promise<User> {
    // This action now correctly calls the single, dedicated flow for user creation/retrieval.
    const user = await getOrCreateUserFlow(firebaseUser);
    revalidatePath('/'); // Revalidate the home page to reflect login state
    return user;
}


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
    revalidatePath('/');
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
