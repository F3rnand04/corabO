'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import type { User } from '@/lib/types';

// Placeholder for flow calls
const autoVerifyIdWithAIFlow = async (user: User) => { console.warn("Genkit flow 'autoVerifyIdWithAIFlow' is disabled."); return { nameMatch: false, idMatch: false, extractedId: '', extractedName: '' }; };
const verifyCampaignPaymentFlow = async (txId: string, campaignId: string) => { console.warn("Genkit flow 'verifyCampaignPaymentFlow' is disabled.") };
const sendNewCampaignNotificationsFlow = async (input: { campaignId: string }) => { console.warn("Genkit flow 'sendNewCampaignNotificationsFlow' is disabled.") };
const deleteUserFlow = async (userId: string) => { 
    console.warn("Genkit flow 'deleteUserFlow' is disabled. Deleting from DB directly."); 
    const db = getFirestore();
    await db.collection('users').doc(userId).delete();
};
const updateUserFlow = async (input: {userId: string, updates: any}) => { 
    console.warn("Genkit flow 'updateUserFlow' is disabled. Updating DB directly."); 
    const db = getFirestore();
    await db.collection('users').doc(input.userId).update(input.updates);
};

/**
 * Approves a user's identity verification.
 */
export async function verifyUserId(userId: string) {
    const db = getFirestore();
    await db.collection('users').doc(userId).update({ 
      idVerificationStatus: 'verified',
      verified: true 
    });
    revalidatePath('/admin');
}

/**
 * Rejects a user's identity verification.
 */
export async function rejectUserId(userId: string) {
    const db = getFirestore();
    await db.collection('users').doc(userId).update({ idVerificationStatus: 'rejected' });
    revalidatePath('/admin');
}


export async function autoVerifyIdWithAI(user: User) {
    return await autoVerifyIdWithAIFlow(user);
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
}

/**
 * Sends notifications for a newly activated campaign.
 */
export async function sendNewCampaignNotifications(input: { campaignId: string }) {
    await sendNewCampaignNotificationsFlow(input);
}


export async function deleteUser(userId: string) {
    await deleteUserFlow(userId);
    revalidatePath('/admin');
}

export async function toggleUserPause(userId: string, shouldUnpause: boolean) {
    const updates = shouldUnpause 
        ? { isPaused: false } 
        : { isPaused: true, pauseReason: 'Paused by admin' };
    await updateUserFlow({ userId, updates });
    revalidatePath('/admin');
}

export async function registerSystemPayment(userId: string, concept: string, amount: number, isSubscription: boolean) {
    // This action would normally call a flow to create the transaction.
    // For now, it's disabled as Genkit is removed.
    console.log(`System payment registration for ${userId} is disabled.`);
    revalidatePath('/transactions');
}
