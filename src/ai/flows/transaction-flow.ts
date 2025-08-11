
'use server';
/**
 * @fileOverview Transaction management flows.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server'; // Use server-side firebase
import { doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Transaction, User, AppointmentRequest } from '@/lib/types';

// --- Schemas ---

const BasicTransactionSchema = z.object({
  transactionId: z.string(),
  userId: z.string(), // The user performing the action
});

const ConfirmWorkReceivedSchema = BasicTransactionSchema.extend({
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
});

const PayCommitmentSchema = BasicTransactionSchema.extend({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
});

const SendQuoteSchema = BasicTransactionSchema.extend({
    breakdown: z.string(),
    total: z.number(),
});

const AppointmentRequestSchema = z.object({
    providerId: z.string(),
    clientId: z.string(),
    date: z.string(),
    details: z.string(),
    amount: z.number(),
});


// --- Flows ---

/**
 * Marks a service transaction as completed by the provider.
 * The transaction status changes to 'Pendiente de Confirmación del Cliente'.
 */
export const completeWork = ai.defineFlow(
  {
    name: 'completeWorkFlow',
    inputSchema: BasicTransactionSchema,
    outputSchema: z.void(),
  },
  async ({ transactionId, userId }) => {
    const txRef = doc(getFirestoreDb(), 'transactions', transactionId);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) throw new Error("Transaction not found.");
    
    const transaction = txSnap.data() as Transaction;
    // SECURITY CHECK: Only the provider can mark work as complete.
    if (transaction.providerId !== userId) {
        throw new Error("Permission denied. User is not the provider for this transaction.");
    }
    // BUSINESS LOGIC: Can only be marked as complete if it's an accepted agreement.
    if (transaction.status !== 'Acuerdo Aceptado - Pendiente de Ejecución') {
        throw new Error("Invalid action. The service must be an accepted agreement first.");
    }
    await updateDoc(txRef, { status: 'Pendiente de Confirmación del Cliente' });
  }
);

/**
 * Confirms that the client has received the service and leaves a rating.
 * The transaction status changes to 'Finalizado - Pendiente de Pago'.
 */
export const confirmWorkReceived = ai.defineFlow(
    {
        name: 'confirmWorkReceivedFlow',
        inputSchema: ConfirmWorkReceivedSchema,
        outputSchema: z.void(),
    },
    async ({ transactionId, userId, rating, comment }) => {
        const txRef = doc(getFirestoreDb(), 'transactions', transactionId);
        const txSnap = await getDoc(txRef);
        if (!txSnap.exists()) throw new Error("Transaction not found.");

        const transaction = txSnap.data() as Transaction;
        // SECURITY CHECK: Only the client can confirm receipt.
        if (transaction.clientId !== userId) {
            throw new Error("Permission denied. User is not the client for this transaction.");
        }
        // BUSINESS LOGIC: Can only confirm if it's pending their confirmation.
        if (transaction.status !== 'Pendiente de Confirmación del Cliente') {
            throw new Error("Invalid action. Work must be marked as complete by provider first.");
        }

        await updateDoc(txRef, { 
            status: 'Finalizado - Pendiente de Pago',
            'details.clientRating': rating,
            'details.clientComment': comment || '',
        });
    }
);


/**
 * Client registers their payment for a service.
 * The transaction status changes to 'Pago Enviado - Esperando Confirmación'.
 */
export const payCommitment = ai.defineFlow(
    {
        name: 'payCommitmentFlow',
        inputSchema: PayCommitmentSchema,
        outputSchema: z.void(),
    },
    async ({ transactionId, userId, rating, comment }) => {
        const txRef = doc(getFirestoreDb(), 'transactions', transactionId);
        const txSnap = await getDoc(txRef);
        if (!txSnap.exists()) throw new Error("Transaction not found.");

        const transaction = txSnap.data() as Transaction;

        // SECURITY CHECK: Only the client can pay.
        if (transaction.clientId !== userId) {
            throw new Error("Permission denied. User is not the client for this transaction.");
        }

        // BUSINESS LOGIC CHECK: Ensure payment is only made when the status is correct.
        if (transaction.status !== 'Finalizado - Pendiente de Pago') {
            throw new Error("Invalid action. Payment can only be made after confirming service reception.");
        }
        
        const updateData: any = { status: 'Pago Enviado - Esperando Confirmación' };
        if (rating) updateData['details.clientRating'] = rating;
        if (comment) updateData['details.clientComment'] = comment;

        await updateDoc(txRef, updateData);
    }
);

/**
 * Provider confirms they have received the payment.
 * The transaction status changes to 'Pagado' or 'Resuelto'.
 */
export const confirmPaymentReceived = ai.defineFlow(
    {
        name: 'confirmPaymentReceivedFlow',
        inputSchema: z.object({ transactionId: z.string(), userId: z.string(), fromThirdParty: z.boolean() }),
        outputSchema: z.void(),
    },
    async ({ transactionId, userId, fromThirdParty }) => {
        const txRef = doc(getFirestoreDb(), 'transactions', transactionId);
        const txSnap = await getDoc(txRef);
        if (!txSnap.exists()) throw new Error("Transaction not found.");
        
        const transaction = txSnap.data() as Transaction;
        // SECURITY CHECK: Only the provider can confirm payment.
        if (transaction.providerId !== userId) {
            throw new Error("Permission denied. User is not the provider for this transaction.");
        }
        // BUSINESS LOGIC: Can only confirm if a payment has been sent.
        if (transaction.status !== 'Pago Enviado - Esperando Confirmación') {
            throw new Error("Invalid action. Client has not registered a payment yet.");
        }
        await updateDoc(txRef, { 
            status: 'Pagado',
            'details.paymentFromThirdParty': fromThirdParty,
        });
    }
);

/**
 * Provider sends a quote for a requested service.
 */
export const sendQuote = ai.defineFlow(
    {
        name: 'sendQuoteFlow',
        inputSchema: SendQuoteSchema,
        outputSchema: z.void(),
    },
    async ({ transactionId, userId, breakdown, total }) => {
        const txRef = doc(getFirestoreDb(), 'transactions', transactionId);
        const txSnap = await getDoc(txRef);
        if (!txSnap.exists()) throw new Error("Transaction not found.");
        
        const transaction = txSnap.data() as Transaction;
        // SECURITY CHECK: Only the provider can send a quote.
        if (transaction.providerId !== userId) {
            throw new Error("Permission denied. User is not the provider for this transaction.");
        }
        // BUSINESS LOGIC: Can only send a quote for a pending request.
        if (transaction.status !== 'Solicitud Pendiente') {
            throw new Error("Invalid action. Quote can only be sent for a pending request.");
        }
        await updateDoc(txRef, {
            status: 'Cotización Recibida',
            amount: total,
            'details.quote': { breakdown, total },
        });
    }
);

/**
 * Client accepts a quote, turning it into a commitment.
 */
export const acceptQuote = ai.defineFlow(
    {
        name: 'acceptQuoteFlow',
        inputSchema: BasicTransactionSchema,
        outputSchema: z.void(),
    },
    async ({ transactionId, userId }) => {
        const txRef = doc(getFirestoreDb(), 'transactions', transactionId);
        const txSnap = await getDoc(txRef);
        if (!txSnap.exists()) throw new Error("Transaction not found.");
        
        const transaction = txSnap.data() as Transaction;
        // SECURITY CHECK: Only the client can accept a quote.
        if (transaction.clientId !== userId) {
            throw new Error("Permission denied. User is not the client for this transaction.");
        }
        // BUSINESS LOGIC: Can only accept a quote that has been received.
        if (transaction.status !== 'Cotización Recibida') {
            throw new Error("Invalid action. A quote must be received before it can be accepted.");
        }
        await updateDoc(txRef, { status: 'Finalizado - Pendiente de Pago' });
    }
);


/**
 * Creates an initial transaction for a requested appointment.
 */
export const createAppointmentRequest = ai.defineFlow(
    {
        name: 'createAppointmentRequestFlow',
        inputSchema: AppointmentRequestSchema,
        outputSchema: z.void(),
    },
    async (request) => {
        // SECURITY: We trust the clientId from the validated client session.
        const txId = `txn-appt-${Date.now()}`;
        const newTransaction: Transaction = {
            id: txId,
            type: 'Servicio',
            status: 'Cita Solicitada',
            date: request.date,
            amount: request.amount,
            clientId: request.clientId,
            providerId: request.providerId,
            participantIds: [request.clientId, request.providerId].sort(),
            details: {
                serviceName: `Solicitud de cita: ${request.details}`,
            },
        };
        const txRef = doc(getFirestoreDb(), 'transactions', txId);
        await setDoc(txRef, newTransaction);
    }
);

/**
 * Provider accepts an appointment, creating a formal commitment.
 */
export const acceptAppointment = ai.defineFlow(
    {
        name: 'acceptAppointmentFlow',
        inputSchema: BasicTransactionSchema,
        outputSchema: z.void(),
    },
    async ({ transactionId, userId }) => {
        const txRef = doc(getFirestoreDb(), 'transactions', transactionId);
        const txSnap = await getDoc(txRef);
        if (!txSnap.exists()) throw new Error("Transaction not found.");

        const transaction = txSnap.data() as Transaction;
        // SECURITY CHECK: Only the provider can accept an appointment.
        if (transaction.providerId !== userId) {
            throw new Error("Permission denied. User is not the provider for this transaction.");
        }
        // BUSINESS LOGIC: Can only accept a requested appointment.
        if (transaction.status !== 'Cita Solicitada') {
            throw new Error("Invalid action. This appointment was not solicited.");
        }
        await updateDoc(txRef, { status: 'Acuerdo Aceptado - Pendiente de Ejecución' });
    }
);


/**
 * Puts a transaction into 'In Disputa' status.
 */
export const startDispute = ai.defineFlow(
    {
        name: 'startDisputeFlow',
        inputSchema: z.string(), // transactionId
        outputSchema: z.void(),
    },
    async (transactionId) => {
        // SECURITY: In a real app, we'd check if the user calling this is a participant.
        const txRef = doc(getFirestoreDb(), 'transactions', transactionId);
        await updateDoc(txRef, { status: 'En Disputa' });
    }
);

    