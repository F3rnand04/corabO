'use server';

import { getFirebaseAdmin } from '@/lib/firebase-server';
getFirebaseAdmin(); // Ensure Firebase is initialized

import type { CreateCampaignInput } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Placeholder for the Genkit flow
const createCampaignFlow = async (input: any) => {
    console.warn("Genkit flow 'createCampaignFlow' is disabled.");
    return null; // Return a value that matches the expected output schema
};

/**
 * Creates a new ad campaign for a provider.
 * This action orchestrates the call to the underlying Genkit flow.
 */
export async function createCampaign(userId: string, campaignData: Omit<CreateCampaignInput, 'userId'>) {
    try {
        const input = { ...campaignData, userId };
        const newCampaign = await createCampaignFlow(input);
        
        // Even if the flow is disabled, revalidation can be kept
        revalidatePath('/profile'); 
        revalidatePath('/transactions');
        
        // This would redirect to a payment page for the campaign budget
        // redirect(`/payment?amount=${newCampaign.budget}&concept=Pago de Campaña ${newCampaign.id}`);
        console.log("Redirect to payment page would happen here.");

    } catch (error) {
        console.error(`[ACTION_ERROR] createCampaign:`, error);
        throw new Error("Failed to create campaign.");
    }
}
