
'use server';

import { revalidatePath } from 'next/cache';
import { getFirebaseFirestore, getFirebaseAuth } from '@/lib/firebase-admin';
import { 
    completeInitialSetupFlow, 
    checkIdUniquenessFlow, 
    toggleGpsFlow, 
    addContactToUserFlow, 
    removeContactFromUserFlow, 
    updateUserFlow, 
    becomeProviderFlow 
} from '@/ai/flows/profile-flow';
import { sendWelcomeToProviderNotificationFlow } from '@/ai/flows/notification-flow';
import { createTransactionFlow } from '@/ai/flows/transaction-flow';
import type { ProfileSetupData, User } from '@/lib/types';


export async function updateUser(userId: string, updates: Partial<User> | { [key: string]: any }) {
    const db = getFirebaseFirestore();
    await updateUserFlow(db, { userId, updates });
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function updateUserProfileImage(userId: string, dataUrl: string) {
    const db = getFirebaseFirestore();
    await updateUserFlow(db, { userId, updates: { profileImage: dataUrl }});
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function updateFullProfile(userId: string, formData: ProfileSetupData, userType: User['type']) {
    const db = getFirebaseFirestore();
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const becameProvider = userType === 'provider' && userSnap.exists() && userSnap.data()?.type === 'client';

    await updateUserFlow(db,
        {
            userId,
            updates: {
                'profileSetupData': formData, 
                'isTransactionsActive': true, 
                'type': userType 
            }
        }
    );

    if(becameProvider) {
        await sendWelcomeToProviderNotificationFlow(db, { userId });
    }

    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}


export async function toggleGps(userId: string) {
    const db = getFirebaseFirestore();
    await toggleGpsFlow(db, { userId });
    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function checkIdUniqueness(input: { idNumber: string; country: string; currentUserId: string; }): Promise<boolean> {
    const db = getFirebaseFirestore();
    return await checkIdUniquenessFlow(db, input);
}

export async function completeInitialSetup(userId: string, data: { name: string; lastName: string; idNumber: string; birthDate: string; country: string; type: User['type'], providerType: ProfileSetupData['providerType'] }): Promise<User> {
    const db = getFirebaseFirestore();
    const updatedUser = await completeInitialSetupFlow(db, userId, data);
    revalidatePath('/'); // Revalidate the home page to reflect login status
    return updatedUser;
}

export async function subscribeUser(userId: string, planName: string, amount: number) {
    const db = getFirebaseFirestore();
    await createTransactionFlow(db, {
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
    const db = getFirebaseFirestore();
    await updateUserFlow(db, { userId, updates: { isTransactionsActive: false }});
    revalidatePath('/transactions/settings');
    revalidatePath('/profile');
}

export async function activatePromotion(userId: string, promotion: { imageId: string; promotionText: string; cost: number }) {
    const db = getFirebaseFirestore();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);

    await updateUserFlow(db,
        {
            userId,
            updates: {
                promotion: {
                    text: promotion.promotionText,
                    expires: expirationDate.toISOString(),
                    publicationId: promotion.imageId,
                }
            }
        }
    );

    await createTransactionFlow(db, {
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
    const db = getFirebaseFirestore();
    await addContactToUserFlow(db, { userId, contactId });
    revalidatePath(`/companies/${contactId}`);
    revalidatePath('/contacts');
}

export async function removeContactFromUser(userId: string, contactId: string) {
    const db = getFirebaseFirestore();
    await removeContactFromUserFlow(db, { userId, contactId });
    revalidatePath('/contacts');
}

export async function becomeProvider(userId: string, profileData: ProfileSetupData) {
    const db = getFirebaseFirestore();
    await becomeProviderFlow(db, { userId, profileData });
    revalidatePath('/profile');
}

    