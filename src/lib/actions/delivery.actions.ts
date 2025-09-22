'use server';

import { revalidatePath } from 'next/cache';
import { findDeliveryProviderFlow, resolveDeliveryAsPickupFlow } from '@/ai/flows/delivery-flow';
import { getFirestore } from 'firebase-admin/firestore';
import type { Transaction } from '@/lib/types';
import { acceptDeliveryJob as acceptDeliveryJobFlow, completeDelivery as completeDeliveryFlow } from '@/ai/flows/delivery-flow';


/**
 * Finds available delivery jobs for a given delivery provider.
 * For simplicity, this currently fetches all jobs waiting for a provider.
 * A real implementation would include geographic filtering.
 */
export async function getDeliveryJobs(providerId: string): Promise<Transaction[]> {
    const db = getFirestore();
    const q = db.collection('transactions').where('status', '==', 'Buscando Repartidor');
    const snapshot = await q.get();
    
    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(doc => doc.data() as Transaction);
}


/**
 * Allows a delivery provider to accept a delivery job.
 */
export async function acceptDeliveryJob(transactionId: string, providerId: string) {
    await acceptDeliveryJobFlow({ transactionId, providerId });
    revalidatePath('/delivery/dashboard');
}

/**
 * Marks a delivery job as completed by the provider.
 */
export async function completeDelivery(transactionId: string) {
    await completeDeliveryFlow({ transactionId });
    revalidatePath('/delivery/dashboard');
}


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
