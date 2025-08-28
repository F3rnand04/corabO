
'use server';

import '@/ai/genkit';
import { revalidatePath } from 'next/cache';
import type { FirebaseUserInput, ProfileSetupData, User } from '@/lib/types';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getOrCreateUserFlow, completeInitialSetupFlow } from '@/ai/flows/auth-flow';
import { checkIdUniquenessFlow, deleteUserFlow, toggleGpsFlow, updateUserFlow } from '@/ai/flows/profile-flow';
import { sendWelcomeToProviderNotificationFlow } from '@/ai/flows/notification-flow';
import { autoVerifyIdWithAIFlow } from '@/ai/flows/verification-flow';


// --- Exported Actions ---

export async function getOrCreateUser(firebaseUser: FirebaseUserInput): Promise<User> {
    const db = getFirestore();
    const userRef = db.collection('users').doc(firebaseUser.uid);
    const userSnap = await userRef.get();

    if (userSnap.exists()) {
      revalidatePath('/');
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
    revalidatePath('/'); 
    return newUser;
}

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

export async function deleteUserAction(userId: string) {
    await deleteUserFlow({ userId });
    revalidatePath('/admin');
}

export async function checkIdUniqueness(input: { idNumber: string; country: string; currentUserId: string; }): Promise<boolean> {
    return await checkIdUniquenessFlow(input);
}

export async function completeInitialSetup(userId: string, data: { name: string; lastName: string; idNumber: string; birthDate: string; country: string; type: User['type'], providerType: ProfileSetupData['providerType'] }): Promise<User> {
    const updatedUser = await completeInitialSetupFlow(userId, data);
    revalidatePath('/'); // Revalidate the home page to reflect login status
    return updatedUser;
}

export async function autoVerifyIdWithAI(user: User): Promise<any> {
    // Ensure the flow is only called if the document URL exists
    if (!user.idDocumentUrl) {
        throw new Error("El documento de identidad no ha sido cargado.");
    }
    return await autoVerifyIdWithAIFlow(user);
}

export async function subscribeUser(userId: string, planName: string, amount: number) {
    const db = getFirestore();
    const txId = `txn-sub-${Date.now()}`;
    const newTransaction = {
        id: txId,
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
    };
    await db.collection('transactions').doc(txId).set(newTransaction);
    revalidatePath('/transactions');
}

export async function deactivateTransactions(userId: string) {
    await updateUser(userId, { isTransactionsActive: false });
    revalidatePath('/transactions/settings');
    revalidatePath('/profile');
}

export async function activatePromotion(userId: string, promotion: { imageId: string; promotionText: string; cost: number }) {
    const db = getFirestore();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);

    await db.collection('users').doc(userId).update({
        promotion: {
            text: promotion.promotionText,
            expires: expirationDate.toISOString(),
            publicationId: promotion.imageId,
        }
    });

    const txId = `txn-promo-${Date.now()}`;
    const newTransaction = {
        id: txId,
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
    };
    await db.collection('transactions').doc(txId).set(newTransaction);

    revalidatePath('/profile');
    revalidatePath(`/companies/${userId}`);
}
