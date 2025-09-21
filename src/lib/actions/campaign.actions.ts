'use server';

import { revalidatePath } from 'next/cache';
import { createCampaignFlow, type CreateCampaignInput } from '@/ai/flows/campaign-flow';


/**
 * Creates a new ad campaign for a provider.
 * This action orchestrates the call to the underlying Genkit flow.
 */
export async function createCampaign(userId: string, campaignData: Omit<CreateCampaignInput, 'userId'>) {
    try {
        const input = { ...campaignData, userId };
        const newCampaign = await createCampaignFlow(input);
        
        revalidatePath('/profile'); 
        revalidatePath('/transactions');
        revalidatePath('/payment');

    } catch (error) {
        console.error(`[ACTION_ERROR] createCampaign:`, error);
        throw new Error("Failed to create campaign.");
    }
}
