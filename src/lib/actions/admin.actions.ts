'use server';

import { revalidatePath } from 'next/cache';
import type { User } from '@/lib/types';
import { autoVerifyIdWithAIFlow } from '@/ai/flows/verification-flow';
import { sendNewCampaignNotificationsFlow } from '@/ai/flows/notification-flow';
import { createManagementUserFlow } from '@/ai/flows/admin-flow';
import { createTransactionFlow } from '@/ai/flows/transaction-flow';
import { updateUserFlow, deleteUserFlow, toggleGpsFlow } from '@/ai/flows/profile-flow';
import { getFirestore } from '../firebase-admin';

/**
 * Approves a user's identity verification.
 */
export async function verifyUserId(userId: string) {
    await updateUserFlow({ userId, updates: { idVerificationStatus: 'verified', verified: true } });
    revalidatePath('/admin');
}

/**
 * Rejects a user's identity verification.
 */
export async function rejectUserId(userId: string) {
    await updateUserFlow({ userId, updates: { idVerificationStatus: 'rejected' } });
    revalidatePath('/admin');
}


export async function autoVerifyIdWithAI(user: User) {
    if (!user.idDocumentUrl) {
        throw new Error("El documento de identidad no ha sido cargado.");
    }
    const result = await autoVerifyIdWithAIFlow({
      userId: user.id,
      nameInRecord: `${user.name} ${user.lastName}`,
      idInRecord: user.idNumber || '',
      documentImageUrl: user.idDocumentUrl,
      isCompany: user.profileSetupData?.providerType === 'company',
    });
    return result;
}

/**
 * Verifies a campaign payment and activates the campaign.
 */
export async function verifyCampaignPayment(transactionId: string, campaignId?: string) {
    const db = getFirestore();
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
    await sendNewCampaignNotificationsFlow(input);
}


export async function deleteUser(userId: string) {
    await deleteUserFlow({ userId });
    revalidatePath('/admin');
}

export async function toggleUserPause(userId: string, shouldUnpause: boolean) {
    const updates = shouldUnpause 
        ? { isPaused: false } 
        : { isPaused: true, pauseReason: 'Paused by admin' };
    await updateUserFlow({ userId, updates });
    revalidatePath('/admin');
}

export async function registerSystemPayment(userId: string, concept: string, amount: number, isSubscription: boolean, voucherUrl: string, reference: string) {
    const txId = `txn-sys-${userId.slice(0,5)}-${Date.now()}`;
    const newTransaction: Omit<Transaction, 'id'> = {
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
    };

    await createTransactionFlow(newTransaction);
    
    revalidatePath('/transactions');
    revalidatePath('/admin');
}

export async function createManagementUser(input: any) {
    return await createManagementUserFlow(input);
}
