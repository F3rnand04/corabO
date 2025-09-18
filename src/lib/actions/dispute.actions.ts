'use server';

import '@/ai/genkit';
import { initiateDisputeResolutionFlow } from '@/ai/flows/dispute-flow';
import { revalidatePath } from 'next/cache';

/**
 * Server Action to securely initiate the dispute resolution process for a transaction.
 */
export async function initiateDisputeResolution(transactionId: string, actorId: string) {
    try {
        const disputeCase = await initiateDisputeResolutionFlow({ transactionId, actorId });
        
        // Revalidate the admin panel to reflect the new state
        revalidatePath('/admin');
        
        return { success: true, disputeCase };
    } catch (error) {
        console.error('[ACTION_ERROR] initiateDisputeResolution:', error);
        throw new Error('Failed to initiate dispute case.');
    }
}
