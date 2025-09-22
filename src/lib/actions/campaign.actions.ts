
'use server';

import { revalidatePath } from 'next/cache';
import { createCampaignFlow, type CreateCampaignInput } from '@/ai/flows/campaign-flow';
import { getFirebaseFirestore } from '../firebase-admin';


/**
 * Creates a new ad campaign for a provider.
 * This action orchestrates the call to the underlying Genkit flow.
 */
export async function createCampaign(userId: string, campaignData: Omit<CreateCampaignInput, 'userId'>) {
    const db = getFirebaseFirestore();
    try {
        const input = { ...campaignData, userId };
        const newCampaign = await createCampaignFlow(db, input);
        
        revalidatePath('/profile'); 
        revalidatePath('/transactions');
        revalidatePath('/payment');

        return newCampaign;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create campaign.";
        console.error(`[ACTION_ERROR] createCampaign:`, error);
        throw new Error(errorMessage);
    }
}
