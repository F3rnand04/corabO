'use server';

import '@/ai/genkit';
import { revalidatePath } from 'next/cache';
import { findDeliveryProviderFlow, resolveDeliveryAsPickupFlow } from '@/ai/flows/delivery-flow';
import { getFirestore } from 'firebase-admin/firestore';


/**
 * Initiates the search for an available delivery provider for a transaction.
 */
export async function retryFindDelivery(input: { transactionId: string }) {
    // This action doesn't await the flow, allowing the UI to respond immediately.
    // The flow will run in the background.
    findDeliveryProviderFlow(input);
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
 */
export async function assignOwnDelivery(transactionId: string, providerId: string) {
    const db = getFirestore();
    const txRef = db.collection('transactions').doc(transactionId);
    await txRef.update({
      'details.deliveryProviderId': providerId,
      status: 'En Reparto',
    });
    revalidatePath('/transactions');
}
