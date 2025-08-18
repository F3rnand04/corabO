
'use server';
/**
 * @fileOverview Flows for managing delivery provider assignment.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Transaction, User } from '@/lib/types';
import { haversineDistance } from '@/lib/utils';
import { sendMessage } from './message-flow';

const FindDeliveryInputSchema = z.object({
  transactionId: z.string(),
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Finds an available delivery provider for a given transaction.
 * It searches in a 3km radius and retries up to 3 times.
 */
export const findDeliveryProvider = ai.defineFlow(
  {
    name: 'findDeliveryProviderFlow',
    inputSchema: FindDeliveryInputSchema,
    outputSchema: z.void(),
  },
  async ({ transactionId }) => {
    const db = getFirestoreDb();
    const txRef = doc(db, 'transactions', transactionId);
    const txSnap = await getDoc(txRef);

    if (!txSnap.exists()) throw new Error('Transaction not found');
    const transaction = txSnap.data() as Transaction;
    
    const providerRef = doc(db, 'users', transaction.providerId);
    const providerSnap = await getDoc(providerRef);
    if (!providerSnap.exists() || !providerSnap.data().profileSetupData?.location) {
        throw new Error('Provider location not found');
    }
    const [providerLat, providerLon] = providerSnap.data().profileSetupData!.location!.split(',').map(Number);
    
    let attempts = 0;
    const MAX_ATTEMPTS = 3;

    while (attempts < MAX_ATTEMPTS) {
        attempts++;
        console.log(`Delivery search attempt ${attempts} for tx: ${transactionId}`);
        
        const q = query(
            collection(db, 'users'),
            where('type', '==', 'repartidor'),
            where('isGpsActive', '==', true)
            // More complex location queries would require a more advanced setup (e.g., GeoFire)
        );
        const repartidoresSnap = await getDocs(q);
        
        const availableRepartidores = repartidoresSnap.docs
            .map(d => d.data() as User)
            .filter(r => {
                if (!r.profileSetupData?.location) return false;
                const [repartidorLat, repartidorLon] = r.profileSetupData.location.split(',').map(Number);
                const distance = haversineDistance(providerLat, providerLon, repartidorLat, repartidorLon);
                return distance <= 3; // 3km radius
            });

        if (availableRepartidores.length > 0) {
            // Found a delivery provider. In a real app, you'd have more logic here
            // like choosing the closest one, checking their current load, etc.
            const assignedRepartidor = availableRepartidores[0];
            
            // This is a simplified notification for the prototype
            await sendMessage({
                conversationId: [transaction.providerId, assignedRepartidor.id].sort().join('-'),
                senderId: transaction.providerId,
                recipientId: assignedRepartidor.id,
                text: `¡Nuevo pedido para entregar! ID: ${transactionId}. Por favor, acéptalo en tu panel de transacciones.`
            });
            return; // Exit the flow successfully
        }

        if (attempts < MAX_ATTEMPTS) {
            await sleep(10000); // Wait 10 seconds before retrying
        }
    }

    // If loop finishes without finding a provider
    await updateDoc(txRef, { status: 'Error de Delivery - Acción Requerida' });
  }
);


/**
 * Resolves a failed delivery attempt by converting it to a pickup order.
 * Notifies the client and creates a refund transaction for the delivery fee if applicable.
 */
export const resolveDeliveryAsPickup = ai.defineFlow(
    {
        name: 'resolveDeliveryAsPickupFlow',
        inputSchema: FindDeliveryInputSchema, // Just needs transactionId
        outputSchema: z.void(),
    },
    async ({ transactionId }) => {
        const db = getFirestoreDb();
        const batch = writeBatch(db);
        const txRef = doc(db, 'transactions', transactionId);
        const txSnap = await getDoc(txRef);

        if (!txSnap.exists()) throw new Error('Transaction not found');
        const transaction = txSnap.data() as Transaction;
        
        // 1. Update original transaction to be a pickup
        batch.update(txRef, {
            status: 'Listo para Retirar en Tienda',
            'details.delivery.method': 'pickup',
        });
        
        // 2. Create refund transaction if delivery was paid
        if (transaction.details.deliveryCost && transaction.details.deliveryCost > 0) {
            const refundTxId = `txn-refund-${transactionId.slice(-6)}`;
            const refundTx: Transaction = {
                id: refundTxId,
                type: 'Sistema',
                status: 'Finalizado - Pendiente de Pago',
                date: new Date().toISOString(),
                amount: transaction.details.deliveryCost,
                // The provider owes the client the refund
                clientId: transaction.providerId,
                providerId: transaction.clientId, 
                participantIds: [transaction.providerId, transaction.clientId],
                details: {
                    system: `Reembolso por delivery fallido (Tx: ${transactionId})`,
                }
            };
            batch.set(doc(db, 'transactions', refundTxId), refundTx);
        }

        // 3. Notify the client
        await sendMessage({
            conversationId: [transaction.providerId, transaction.clientId].sort().join('-'),
            senderId: transaction.providerId,
            recipientId: transaction.clientId,
            text: `¡Hola! Tuvimos un inconveniente para encontrar un repartidor. Tu pedido ha sido actualizado y ya puedes pasar a retirarlo por nuestra tienda. Si pagaste por el envío, hemos creado un compromiso de reembolso.`
        });

        await batch.commit();
    }
);
