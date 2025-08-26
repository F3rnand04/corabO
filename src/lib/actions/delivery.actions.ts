'use server';

import { getFirebaseAdmin } from '@/lib/firebase-server';
getFirebaseAdmin(); // Ensure Firebase is initialized

import { revalidatePath } from 'next/cache';
import { findDeliveryProviderFlow, resolveDeliveryAsPickupFlow } from '@/ai/flows/delivery-flow';


/**
 * Initiates the search for an available delivery provider for a transaction.
 */
export async function retryFindDelivery(input: { transactionId: string }) {
    // This action doesn't await the flow, allowing the UI to respond immediately.
    // The flow will run in the background.
    await findDeliveryProviderFlow(input);
    revalidatePath('/transactions');
}

/**
 * Resolves a failed delivery by converting the order to a pickup.
 */
export async function resolveDeliveryAsPickup(input: { transactionId: string }) {
    await resolveDeliveryAsPickupFlow(input);
    revalidatePath('/transactions');
}

/**
 * Allows a provider to assign themselves as the delivery person for an order.
 * This is a simplified action that directly updates the transaction.
 * In a real-world scenario, this might involve more complex logic.
 */
export async function assignOwnDelivery(transactionId: string, providerId: string) {
    // In a full implementation, you would have a dedicated Genkit flow for this.
    // For now, this is a placeholder for the logic.
    console.log(`Provider ${providerId} is assigning themselves to deliver transaction ${transactionId}.`);
    // Example: await assignSelfDeliveryFlow({ transactionId, providerId });
    revalidatePath('/transactions');
}
