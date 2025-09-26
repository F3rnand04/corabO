'use server';

import { revalidatePath } from 'next/cache';
import { sendNewCampaignNotificationsFlow } from '@/ai/flows/notification-flow';
import { createManagementUserFlow } from '@/ai/flows/admin-flow';
import { createTransactionFlow } from '@/ai/flows/transaction-flow';
import { getFirebaseAuth, getFirebaseFirestore } from '../firebase-admin';
import { deleteUserFlow } from '@/ai/flows/profile-flow';

/**
 * Approves a user's identity verification.
 */
export async function verifyUserId(userId: string) {
    const db = getFirebaseFirestore();
    await db.collection('users').doc(userId).update({ 
        idVerificationStatus: 'verified',
        verified: true, 
        idRejectionReason: null // Clear any previous rejection reason
    });
    revalidatePath('/admin');
}

/**
 * Rejects a user's identity verification with a reason.
 */
export async function rejectUserId(userId: string, reason: string) {
    const db = getFirebaseFirestore();
    await db.collection('users').doc(userId).update({ 
        idVerificationStatus: 'rejected',
        idRejectionReason: reason 
    });
    revalidatePath('/admin');
}

/**
 * Verifies a campaign payment and activates the campaign.
 */
export async function verifyCampaignPayment(transactionId: string, campaignId?: string) {
    const db = getFirebaseFirestore();
    const batch = db.batch();
    
    const txRef = db.collection('transactions').doc(transactionId);
    batch.update(txRef, { status: 'Pagado' });

    if (campaignId) {
        const campaignRef = db.collection('campaigns').doc(campaignId);
        batch.update(campaignRef, { status: 'active' });
    }

    await batch.commit();
    revalidatePath('/admin');
    revalidatePath('/transactions');
}

/**
 * Sends notifications for a newly activated campaign.
 */
export async function sendNewCampaignNotifications(input: { campaignId: string }) {
    const db = getFirebaseFirestore();
    await sendNewCampaignNotificationsFlow(db, input);
}


export async function deleteUser(userId: string) {
    const db = getFirebaseFirestore();
    const auth = getFirebaseAuth();
    await deleteUserFlow(db, auth, { userId });
    revalidatePath('/admin');
}

export async function toggleUserPause(userId: string, isCurrentlyPaused: boolean) {
    const db = getFirebaseFirestore();
    const updates = isCurrentlyPaused 
        ? { isPaused: false, pauseReason: null } 
        : { isPaused: true, pauseReason: 'Paused by admin' };
    await db.collection('users').doc(userId).update(updates);
    revalidatePath('/admin');
}

export async function registerSystemPayment(userId: string, concept: string, amount: number, isSubscription: boolean, voucherUrl: string, reference: string) {
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
            system: concept,
            isSubscription: isSubscription,
            paymentMethod: 'direct',
            paymentVoucherUrl: voucherUrl,
            paymentReference: reference,
            paymentSentAt: new Date().toISOString(),
        }
    });
    
    revalidatePath('/transactions');
    revalidatePath('/admin');
}

export async function createManagementUser(input: any) {
    const auth = getFirebaseAuth();
    const db = getFirebaseFirestore();
    return await createManagementUserFlow(auth, db, input);
}
