'use server';

// The getFirebaseAdmin() call is removed. The action now relies on the
// globally initialized Firebase instance managed by Genkit.
import { getFirestore } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import type { User } from '@/lib/types';
import { autoVerifyIdWithAIFlow } from '@/ai/flows/verification-flow';
import { sendNewCampaignNotificationsFlow } from '@/ai/flows/notification-flow';

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
    const db = getFirestore();
    await db.collection('users').doc(userId).delete();
    revalidatePath('/admin');
}

export async function toggleUserPause(userId: string, shouldUnpause: boolean) {
    const db = getFirestore();
    const updates = shouldUnpause 
        ? { isPaused: false } 
        : { isPaused: true, pauseReason: 'Paused by admin' };
    await db.collection('users').doc(userId).update(updates);
    revalidatePath('/admin');
}

export async function registerSystemPayment(userId: string, concept: string, amount: number, isSubscription: boolean) {
    console.log(`System payment registration for ${userId} is disabled.`);
    revalidatePath('/transactions');
}
