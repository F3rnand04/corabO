'use server';

import { revalidatePath } from 'next/cache';
import { getFirebaseFirestore } from '@/lib/firebase-admin';
import * as profileFlow from '@/ai/flows/profile-flow';
import { sendWelcomeToProviderNotificationFlow } from '@/ai/flows/notification-flow';
import { createTransactionFlow } from '@/ai/flows/transaction-flow';
import type { ProfileSetupData, User } from '@/lib/types';

export async function updateUser(userId: string, updates: Partial<User> | { [key: string]: any }) {
    const db = getFirebaseFirestore();
    await profileFlow.updateUserFlow(db, { userId, updates });
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function updateUserProfileImage(userId: string, dataUrl: string) {
    const db = getFirebaseFirestore();
    await profileFlow.updateUserFlow(db, { userId, updates: { profileImage: dataUrl }});
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function updateFullProfile(userId: string, formData: ProfileSetupData, userType: User['type']) {
    const db = getFirebaseFirestore();
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const becameProvider = userType === 'provider' && userSnap.exists && userSnap.data()?.type === 'client';

    await profileFlow.updateUserFlow(db, {
        userId,
        updates: {
            'profileSetupData': formData, 
            'isTransactionsActive': true, 
            'type': userType,
            'verified': true
        }
    });

    if(becameProvider) {
        await sendWelcomeToProviderNotificationFlow(db, { userId });
    }

    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function toggleGps(userId: string) {
    const db = getFirebaseFirestore();
    await profileFlow.toggleGpsFlow(db, { userId });
    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function checkIdUniqueness(input: { idNumber: string; country: string; currentUserId: string; }): Promise<boolean> {
    const db = getFirebaseFirestore();
    if (!input.idNumber || !input.country) {
      return true; // Don't run check if data is incomplete
    }
    const usersRef = db.collection('users');
    const q = usersRef.where("idNumber", "==", input.idNumber).where("country", "==", input.country);
    const querySnapshot = await q.get();
    
    if (querySnapshot.empty) {
      return true; // ID is unique
    }

    // If a document is found, check if it's the user's own document
    const isOwnDocument = querySnapshot.docs[0].id === input.currentUserId;
    return isOwnDocument;
}

export async function completeInitialSetup(userId: string, data: { name: string; lastName: string; idNumber: string; birthDate: string; country: string; type: User['type'], providerType: ProfileSetupData['providerType'] }): Promise<User> {
    const db = getFirebaseFirestore();
    const updatedUser = await profileFlow.completeInitialSetupFlow(db, userId, data);
    revalidatePath('/');
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
            system: `Suscripción a ${planName}`
        },
    });
    revalidatePath('/transactions');
}

export async function deactivateTransactions(userId: string) {
    const db = getFirebaseFirestore();
    await profileFlow.updateUserFlow(db, { userId, updates: { isTransactionsActive: false }});
    revalidatePath('/transactions/settings');
    revalidatePath('/profile');
}

export async function activatePromotion(userId: string, promotion: { imageId: string; promotionText: string; cost: number }) {
    const db = getFirebaseFirestore();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);

    await profileFlow.updateUserFlow(db, {
        userId,
        updates: {
            promotion: {
                text: promotion.promotionText,
                expires: expirationDate.toISOString(),
                publicationId: promotion.imageId,
            }
        }
    });

    await createTransactionFlow(db, {
        type: 'Sistema',
        status: 'Pago Enviado - Esperando Confirmación',
        date: new Date().toISOString(),
        amount: promotion.cost,
        clientId: userId,
        providerId: 'corabo-admin',
        participantIds: [userId, 'corabo-admin'],
        details: {
            system: `Activación de promoción 'Emprende por Hoy'`
        },
    });

    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}

export async function addContactToUser(userId: string, contactId: string) {
    const db = getFirebaseFirestore();
    await profileFlow.addContactToUserFlow(db, { userId, contactId });
    revalidatePath(`/companies/${contactId}`);
    revalidatePath('/contacts');
}

export async function removeContactFromUser(userId: string, contactId: string) {
    const db = getFirebaseFirestore();
    await profileFlow.removeContactFromUserFlow(db, { userId, contactId });
    revalidatePath('/contacts');
}

export async function becomeProvider(userId: string, profileData: ProfileSetupData) {
    const db = getFirebaseFirestore();
    await profileFlow.becomeProviderFlow(db, { userId, profileData });
    revalidatePath('/profile');
}

export async function updateUserLocation(userId: string, location: { latitude: number; longitude: number }) {
    const db = getFirebaseFirestore();
    await profileFlow.updateUserFlow(db, { 
        userId, 
        updates: { 
            'location.coordinates': location,
            'location.lastUpdated': new Date().toISOString() 
        }
    });
}
