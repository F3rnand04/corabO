'use server';

import { initiateDisputeResolutionFlow } from '@/ai/flows/dispute-flow';
import { revalidatePath } from 'next/cache';
import { getFirebaseFirestore } from '../firebase-admin';

/**
 * Server Action to securely initiate the dispute resolution process for a transaction.
 */
export async function initiateDisputeResolution(transactionId: string, actorId: string) {
    try {
        const db = getFirebaseFirestore();
        const disputeCase = await initiateDisputeResolutionFlow(db, { transactionId, actorId });
        
        // Revalidate the admin panel to reflect the new state
        revalidatePath('/admin');
        
        return { success: true, disputeCase };
    } catch (error) {
        console.error('[ACTION_ERROR] initiateDisputeResolution:', error);
        throw new Error('Failed to initiate dispute case.');
    }
}
