'use server';

import { revalidatePath } from 'next/cache';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getOrCreateUserFlow, completeInitialSetupFlow, checkIdUniquenessFlow, toggleGpsFlow, updateUserFlow, addContactToUserFlow, removeContactFromUserFlow } from '@/ai/flows/profile-flow';
import { sendWelcomeToProviderNotificationFlow } from '@/ai/flows/notification-flow';
import { createTransactionFlow } from '@/ai/flows/transaction-flow';
import { credicoraCompanyLevels, credicoraLevels } from '../data/options';
import type { FirebaseUserInput, ProfileSetupData, User } from '@/lib/types';


// --- Exported Actions ---

export async function updateUser(userId: string, updates: Partial<User> | { [key: string]: any }) {
    await updateUserFlow({ userId, updates });
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function updateUserProfileImage(userId: string, dataUrl: string) {
    await updateUserFlow({ userId, updates: { profileImage: dataUrl } });
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function updateFullProfile(userId: string, formData: ProfileSetupData, userType: User['type']) {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const becameProvider = userType === 'provider' && userSnap.exists() && userSnap.data()?.type === 'client';

    await updateUserFlow({
        userId,
        updates: {
            'profileSetupData': formData, 
            'isTransactionsActive': true, 
            'type': userType 
        }
    });

    if(becameProvider) {
        sendWelcomeToProviderNotificationFlow({ userId });
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

export async function checkIdUniqueness(input: { idNumber: string; country: string; currentUserId: string; }): Promise<boolean> {
    return await checkIdUniquenessFlow(input);
}

export async function completeInitialSetup(userId: string, data: { name: string; lastName: string; idNumber: string; birthDate: string; country: string; type: User['type'], providerType: ProfileSetupData['providerType'] }): Promise<User> {
    const updatedUser = await completeInitialSetupFlow(userId, data);
    revalidatePath('/'); // Revalidate the home page to reflect login status
    return updatedUser;
}

export async function subscribeUser(userId: string, planName: string, amount: number) {
    await createTransactionFlow({
        type: 'Sistema',
        status: 'Pago Enviado - Esperando Confirmación',
        date: new Date().toISOString(),
        amount: amount,
        clientId: userId,
        providerId: 'corabo-admin',
        participantIds: [userId, 'corabo-admin'],
        details: {
            system: `Suscripción a ${planName}`,
            isSubscription: true
        },
    });
    revalidatePath('/transactions');
}

export async function deactivateTransactions(userId: string) {
    await updateUser(userId, { isTransactionsActive: false });
    revalidatePath('/transactions/settings');
    revalidatePath('/profile');
}

export async function activatePromotion(userId: string, promotion: { imageId: string; promotionText: string; cost: number }) {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);

    await updateUserFlow({
        userId,
        updates: {
            promotion: {
                text: promotion.promotionText,
                expires: expirationDate.toISOString(),
                publicationId: promotion.imageId,
            }
        }
    });

    await createTransactionFlow({
        type: 'Sistema',
        status: 'Pago Enviado - Esperando Confirmación',
        date: new Date().toISOString(),
        amount: promotion.cost,
        clientId: userId,
        providerId: 'corabo-admin',
        participantIds: [userId, 'corabo-admin'],
        details: {
            system: `Activación de promoción 'Emprende por Hoy'`,
        },
    });

    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function addContactToUser(userId: string, contactId: string) {
    await addContactToUserFlow({ userId, contactId });
    revalidatePath(`/companies/${contactId}`);
    revalidatePath('/contacts');
}

export async function removeContactFromUser(userId: string, contactId: string) {
    await removeContactFromUserFlow({ userId, contactId });
    revalidatePath('/contacts');
}

export async function becomeProvider(userId: string, profileData: ProfileSetupData) {
    await updateUserFlow({
        userId,
        updates: {
            type: profileData.providerType === 'delivery' ? 'repartidor' : 'provider',
            profileSetupData: profileData,
            isTransactionsActive: true
        }
    });
    revalidatePath('/profile');
}
