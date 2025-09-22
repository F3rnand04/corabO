
'use server';

import { revalidatePath } from 'next/cache';
import { findDeliveryProviderFlow, resolveDeliveryAsPickupFlow } from '@/ai/flows/delivery-flow';
import { getFirebaseFirestore } from '../firebase-admin';
import type { Transaction } from '@/lib/types';
import { acceptDeliveryJob as acceptDeliveryJobFlow, completeDelivery as completeDeliveryFlow } from '@/ai/flows/delivery-flow';


/**
 * Finds available delivery jobs for a given delivery provider.
 * For simplicity, this currently fetches all jobs waiting for a provider.
 * A real implementation would include geographic filtering.
 */
export async function getDeliveryJobs(providerId: string): Promise<Transaction[]> {
    const db = getFirebaseFirestore();
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
    const db = getFirebaseFirestore();
    await acceptDeliveryJobFlow(db, { transactionId, providerId });
    revalidatePath('/delivery/dashboard');
}

/**
 * Marks a delivery job as completed by the provider.
 */
export async function completeDelivery(transactionId: string) {
    const db = getFirebaseFirestore();
    await completeDeliveryFlow(db, { transactionId });
    revalidatePath('/delivery/dashboard');
}


/**
 * Initiates the search for an available delivery provider for a transaction.
 */
export async function retryFindDelivery(input: { transactionId: string }) {
    const db = getFirebaseFirestore();
    // This action doesn't await the flow, allowing the UI to respond immediately.
    // The flow will run in the background.
    findDeliveryProviderFlow(db, { transactionId: input.transactionId });
    revalidatePath('/transactions');
}

/**
 * Resolves a failed delivery by converting the order to a pickup.
 */
export async function resolveDeliveryAsPickup(input: { transactionId: string }) {
    const db = getFirebaseFirestore();
    await resolveDeliveryAsPickupFlow(db, input);
    revalidatePath('/transactions');
}

/**
 * Allows a provider to assign themselves as the delivery person for an order.
 * This is a simplified action that directly updates the transaction.
 */
export async function assignOwnDelivery(transactionId: string, providerId: string) {
    const db = getFirebaseFirestore();
    const txRef = db.collection('transactions').doc(transactionId);
    await txRef.update({
      'details.deliveryProviderId': providerId,
      status: 'En Reparto',
    });
    revalidatePath('/transactions');
}
