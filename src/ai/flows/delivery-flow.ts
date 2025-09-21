'use server';
/**
 * @fileOverview Flows for managing delivery provider assignment.
 */
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import type { Transaction, User } from '@/lib/types';
import { haversineDistance } from '@/lib/utils';
import { sendMessageFlow } from './message-flow';
import { sendNotification } from './notification-flow';

const FindDeliveryInputSchema = z.object({
  transactionId: z.string(),
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculates the delivery cost based on distance at a rate of $1 per km.
 * @param distanceInKm The distance in kilometers.
 * @returns The calculated delivery cost.
 */
export async function calculateDeliveryCostFlow({ distanceInKm }: { distanceInKm: number }): Promise<number> {
    const perKmRate = 1.00; // $1 per kilometer
    const cost = distanceInKm * perKmRate;
    
    // Return cost rounded to two decimal places
    return Math.round(cost * 100) / 100;
}


/**
 * Finds an available delivery provider for a given transaction.
 * It searches in a 3km radius and retries up to 3 times.
 */
export async function findDeliveryProviderFlow({ transactionId }: { transactionId: string }) {
    const db = getFirestore();
    const txRef = db.collection('transactions').doc(transactionId);
    const txSnap = await txRef.get();

    if (!txSnap.exists) throw new Error('Transaction not found');
    const transaction = txSnap.data() as Transaction;
    
    const providerRef = db.collection('users').doc(transaction.providerId);
    const providerSnap = await providerRef.get();
    if (!providerSnap.exists || !providerSnap.data()?.profileSetupData?.location) {
        throw new Error('Provider location not found');
    }
    const [providerLat, providerLon] = (providerSnap.data() as User).profileSetupData!.location!.split(',').map(Number);
    
    let attempts = 0;
    const MAX_ATTEMPTS = 3;

    while (attempts < MAX_ATTEMPTS) {
        attempts++;
        console.log(`Delivery search attempt ${'${attempts}'} for tx: ${'${transactionId}'}`);
        
        const q = db.collection('users')
            .where('type', '==', 'repartidor')
            .where('isGpsActive', '==', true);
        const repartidoresSnap = await q.get();
        
        const availableRepartidores = repartidoresSnap.docs
            .map(d => d.data() as User)
            .filter(r => {
                if (!r.profileSetupData?.location) return false;
                const [repartidorLat, repartidorLon] = r.profileSetupData.location.split(',').map(Number);
                const distance = haversineDistance(providerLat, providerLon, repartidorLat, repartidorLon);
                return distance <= 3; // 3km radius
            });

        if (availableRepartidores.length > 0) {
            const assignedRepartidor = availableRepartidores[0];

            await txRef.update({
              'details.deliveryProviderId': assignedRepartidor.id,
              status: 'En Reparto',
            });
            
            await sendMessageFlow({
                conversationId: [transaction.providerId, assignedRepartidor.id].sort().join('-'),
                senderId: transaction.providerId,
                recipientId: assignedRepartidor.id,
                text: `¡Nuevo pedido para entregar! ID: ${'${transactionId}'}. Por favor, acéptalo en tu panel de transacciones.`
            });
            return;
        }

        if (attempts < MAX_ATTEMPTS) {
            await sleep(10000);
        }
    }

    await txRef.update({ status: 'Error de Delivery - Acción Requerida' });

    await sendNotification({
        userId: transaction.providerId,
        type: 'admin_alert',
        title: 'Error en Asignación de Delivery',
        message: `No pudimos encontrar un repartidor para la orden ${'${transaction.id.slice(-6)}'}. Revisa la transacción para elegir una alternativa.`,
        link: `/transactions?tx=${'${transaction.id}'}`
    });
  }



/**
 * Resolves a failed delivery attempt by converting it to a pickup order.
 * Notifies the client and creates a refund transaction for the delivery fee if applicable.
 */
export async function resolveDeliveryAsPickupFlow({ transactionId }: { transactionId: string }) {
    const db = getFirestore();
    const batch = db.batch();
    const txRef = db.collection('transactions').doc(transactionId);
    const txSnap = await txRef.get();

    if (!txSnap.exists) throw new Error('Transaction not found');
    const transaction = txSnap.data() as Transaction;
    
    batch.update(txRef, {
        status: 'Listo para Retirar en Tienda',
        'details.delivery.method': 'pickup',
    });
    
    if (transaction.details.deliveryCost && transaction.details.deliveryCost > 0) {
        const refundTxId = `txn-refund-${'${transactionId.slice(-6)}'}`;
        const refundTx: Transaction = {
            id: refundTxId,
            type: 'Sistema',
            status: 'Finalizado - Pendiente de Pago',
            date: new Date().toISOString(),
            amount: transaction.details.deliveryCost,
            clientId: transaction.providerId,
            providerId: transaction.clientId, 
            participantIds: [transaction.providerId, transaction.clientId],
            details: {
                system: `Reembolso por delivery fallido (Tx: ${'${transactionId}'})`,
            }
        };
        batch.set(db.collection('transactions').doc(refundTxId), refundTx);
    }

    await sendMessageFlow({
        conversationId: [transaction.providerId, transaction.clientId].sort().join('-'),
        senderId: transaction.providerId,
        recipientId: transaction.clientId,
        text: `¡Hola! Tuvimos un inconveniente para encontrar un repartidor. Tu pedido ha sido actualizado y ya puedes pasar a retirarlo por nuestra tienda. Si pagaste por el envío, hemos creado un compromiso de reembolso.`
    });

    await batch.commit();
}
