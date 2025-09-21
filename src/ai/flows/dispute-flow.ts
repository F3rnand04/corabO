'use server';

/**
 * @fileOverview Flows for managing transaction disputes.
 */
import { z } from 'zod';
import { getFirebaseFirestore } from '@/lib/firebase-admin';
import type { DisputeCase, Transaction } from '@/lib/types';
import { sendNotification } from './notification-flow';

const InitiateDisputeSchema = z.object({
  transactionId: z.string(),
  actorId: z.string(), // Admin initiating the resolution process
});
type InitiateDisputeInput = z.infer<typeof InitiateDisputeSchema>;

/**
 * Creates a formal dispute case based on a transaction.
 * This function is intended to be called by an admin from the management panel.
 */
export async function initiateDisputeResolutionFlow(input: InitiateDisputeInput): Promise<DisputeCase> {
    const db = getFirebaseFirestore();
    const batch = db.batch();

    const txRef = db.collection('transactions').doc(input.transactionId);
    const txSnap = await txRef.get();

    if (!txSnap.exists) {
        throw new Error('Transaction not found.');
    }
    const transaction = txSnap.data() as Transaction;
    
    const disputeId = transaction.id; // Use the transaction ID as the dispute ID
    const disputeRef = db.collection('disputes').doc(disputeId);
    
    // Check if a dispute case already exists
    const disputeSnap = await disputeRef.get();
    if(disputeSnap.exists) {
        // If it exists, just return it without creating a new one
        return disputeSnap.data() as DisputeCase;
    }
    
    const newDisputeCase: DisputeCase = {
        id: disputeId,
        status: 'investigating',
        clientId: transaction.clientId,
        providerId: transaction.providerId,
        managerId: input.actorId,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
    };

    batch.set(disputeRef, newDisputeCase);
    
    // Optionally update the transaction status to reflect it's being handled
    // This is already set when the user initiates the dispute, so we may not need to change it.
    // batch.update(txRef, { status: 'En Disputa' }); 

    await batch.commit();

    // Notify both parties that a manager is now handling the case
    const notificationMessage = `Un gestor de Corabo ha comenzado a investigar el caso de la transacción #${'${transaction.id.slice(-6)}'}. Serás contactado pronto.`;
    
    await sendNotification({
        userId: transaction.clientId,
        type: 'admin_alert',
        title: 'Tu disputa está siendo revisada',
        message: notificationMessage,
        link: `/transactions?tx=${'${transaction.id}'}`
    });
    
    await sendNotification({
        userId: transaction.providerId,
        type: 'admin_alert',
        title: 'Una disputa está siendo revisada',
        message: notificationMessage,
        link: `/transactions?tx=${'${transaction.id}'}`
    });

    return newDisputeCase;
}
