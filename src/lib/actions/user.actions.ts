
'use server';

import { 
    getOrCreateUser, 
    updateUserFlow, 
    toggleGpsFlow,
    deleteUserFlow,
    checkIdUniquenessFlow,
    completeInitialSetupFlow,
} from '@/ai/flows/profile-flow';
import { sendSmsVerificationCodeFlow, verifySmsCodeFlow } from '@/ai/flows/sms-flow';
import { revalidatePath } from 'next/cache';
import type { FirebaseUserInput, ProfileSetupData, User, VerificationOutput } from '@/lib/types';
import { autoVerifyIdWithAIFlow } from '@/ai/flows/verification-flow';
import { sendWelcomeToProviderNotificationFlow } from '@/ai/flows/notification-flow';
import { createTransactionFlow } from '@/ai/flows/transaction-flow';

export async function getOrCreateUser(firebaseUser: FirebaseUserInput): Promise<User> {
    const user = await getOrCreateUser(firebaseUser);
    revalidatePath('/');
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
    const updates = {
      'profileSetupData': formData,
      'isTransactionsActive': true, 
      'type': userType,
    };
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
    // This creates a system transaction that needs to be paid.
    await createTransactionFlow({
        type: 'Sistema',
        status: 'Finalizado - Pendiente de Pago',
        date: new Date().toISOString(),
        amount: amount,
        clientId: userId,
        providerId: 'corabo-admin', // System as provider
        participantIds: [userId, 'corabo-admin'],
        details: {
            system: `Suscripción: ${planName}`,
            isSubscription: true,
        }
    });

    revalidatePath('/transactions');
    revalidatePath('/payment', 'layout'); // Navigate to payment page layout
}

export async function deactivateTransactions(userId: string) {
    await updateUserFlow({ userId, updates: { isTransactionsActive: false } });
    revalidatePath('/transactions/settings');
    revalidatePath('/profile');
}
