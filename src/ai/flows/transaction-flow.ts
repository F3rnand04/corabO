

'use server';
/**
 * @fileOverview Transaction management flows.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server'; // Use server-side firebase
import { doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Transaction, User, AppointmentRequest, QrSession } from '@/lib/types';
import { credicoraLevels } from '@/lib/types';
import { addDays } from 'date-fns';

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

const ProcessDirectPaymentSchema = z.object({
  sessionId: z.string(),
});


// --- Flows ---

/**
 * Creates the initial transaction and subsequent Credicora installment transactions
 * after a direct QR payment is finalized by the provider.
 */
export const processDirectPayment = ai.defineFlow(
    {
        name: 'processDirectPaymentFlow',
        inputSchema: ProcessDirectPaymentSchema,
        outputSchema: z.void(),
    },
    async ({ sessionId }) => {
        const db = getFirestoreDb();
        const batch = writeBatch(db);

        const sessionRef = doc(db, 'qr_sessions', sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (!sessionSnap.exists()) {
            throw new Error("QR Session not found");
        }
        const session = sessionSnap.data() as QrSession;

        if (!session.amount || !session.initialPayment) {
            throw new Error("Invalid session data: amount is missing.");
        }

        // 1. Create the main transaction for the initial payment
        const initialTxId = `txndp-${sessionId}`;
        const initialTransaction: Transaction = {
            id: initialTxId,
            type: 'Compra Directa',
            status: 'Pagado',
            date: new Date().toISOString(),
            amount: session.initialPayment,
            clientId: session.clientId,
            providerId: session.providerId,
            participantIds: [session.clientId, session.providerId],
            details: {
                paymentMethod: 'direct',
                paymentVoucherUrl: session.voucherUrl,
                system: `Pago inicial de compra por $${session.amount.toFixed(2)}`
            }
        };
        batch.set(doc(db, 'transactions', initialTxId), initialTransaction);
        
        // 2. Create installment transactions if financed
        if (session.financedAmount && session.installments && session.financedAmount > 0) {
            const installmentAmount = session.financedAmount / session.installments;
            for (let i = 1; i <= session.installments; i++) {
                const installmentTxId = `txn-credicora-${sessionId.slice(-4)}-${i}`;
                const dueDate = addDays(new Date(), i * 15);
                const installmentTx: Transaction = {
                    id: installmentTxId,
                    type: 'Sistema',
                    status: 'Finalizado - Pendiente de Pago',
                    date: dueDate.toISOString(),
                    amount: installmentAmount,
                    clientId: session.clientId,
                    providerId: 'corabo-admin',
                    participantIds: [session.clientId, 'corabo-admin'],
                    details: {
                        system: `Cuota ${i}/${session.installments} de Compra Directa`,
                    },
                };
                batch.set(doc(db, 'transactions', installmentTxId), installmentTx);
            }

            // 3. Update client's Credicora limit
            const clientRef = doc(db, 'users', session.clientId);
            const clientSnap = await getDoc(clientRef);
            if (clientSnap.exists()) {
                const client = clientSnap.data() as User;
                const newCredicoraLimit = (client.credicoraLimit || 0) - session.financedAmount;
                batch.update(clientRef, { credicoraLimit: newCredicoraLimit });
            }
        }
        
        // 4. Mark session as completed
        batch.update(sessionRef, { status: 'completed' });
        
        await batch.commit();
    }
);


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
 * This flow now handles two scenarios for flexibility:
 * 1. Paying a commitment that is 'Finalizado - Pendiente de Pago'.
 * 2. Paying a commitment that is still 'Acuerdo Aceptado - Pendiente de Ejecución',
 *    which implicitly confirms service reception.
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

        // BUSINESS LOGIC CHECK: Allow payment from two states.
        const isPendingPayment = transaction.status === 'Finalizado - Pendiente de Pago';
        const isAcceptedAgreement = transaction.status === 'Acuerdo Aceptado - Pendiente de Ejecución';

        if (!isPendingPayment && !isAcceptedAgreement) {
            throw new Error("Invalid action. Payment can only be made for a pending or accepted agreement.");
        }
        
        // If client pays from an accepted agreement, a rating is required to confirm reception.
        if (isAcceptedAgreement && !rating) {
            throw new Error("A rating is required to confirm service reception and pay.");
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

    

    
