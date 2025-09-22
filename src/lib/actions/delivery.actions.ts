
'use server';

import { revalidatePath } from 'next/cache';
import { findDeliveryProviderFlow, resolveDeliveryAsPickupFlow } from '@/ai/flows/delivery-flow';
import { getFirestore } from 'firebase-admin/firestore';
import type { Transaction } from '@/lib/types';


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
    const db = getFirestore();
    await db.collection('transactions').doc(transactionId).update({
        'details.deliveryProviderId': providerId,
        status: 'En Reparto',
    });
    revalidatePath('/delivery/dashboard');
}

/**
 * Marks a delivery job as completed by the provider.
 */
export async function completeDelivery(transactionId: string) {
    const db = getFirestore();
    const txRef = db.collection('transactions').doc(transactionId);
    
    const txSnap = await txRef.get();
    if(!txSnap.exists) throw new Error("Transaction not found.");
    const transaction = txSnap.data() as Transaction;
    
    // Create the payment transaction for the delivery provider
    const deliveryPaymentTxId = `txn-delivery-fee-${transactionId.slice(-6)}`;
    const deliveryFee = (transaction.details.deliveryCost || 0) * 0.85; // Assume 15% commission

    const deliveryPaymentTx: Transaction = {
        id: deliveryPaymentTxId,
        type: 'Sistema',
        status: 'Pagado',
        date: new Date().toISOString(),
        amount: deliveryFee,
        clientId: transaction.details.deliveryProviderId!, // The delivery person is the "client" of the system payment
        providerId: 'corabo-admin', 
        participantIds: [transaction.details.deliveryProviderId!, 'corabo-admin'],
        details: {
            system: `Pago por servicio de delivery (Tx: ${transactionId})`,
        }
    };
    
    const batch = db.batch();
    batch.update(txRef, { status: 'Pagado' }); // Mark the original transaction as fully paid/delivered
    batch.set(db.collection('transactions').doc(deliveryPaymentTxId), deliveryPaymentTx);
    
    await batch.commit();

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
