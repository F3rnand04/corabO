
'use server';
/**
 * @fileOverview Transaction management flows.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestoreDb } from '@/lib/firebase-server'; // Use server-side firebase
import { doc, getDoc, setDoc, updateDoc, writeBatch, increment, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import type { Transaction, User, AppointmentRequest, QrSession, Product } from '@/lib/types';
import { credicoraLevels } from '@/lib/types';
import { addDays, endOfMonth } from 'date-fns';
import { getExchangeRate } from './exchange-rate-flow';
import { findDeliveryProvider } from './delivery-flow';

// --- Schemas ---

const BasicTransactionSchema = z.object({
  transactionId: z.string(),
  userId: z.string(), // The user performing the action
});

const ConfirmWorkReceivedSchema = BasicTransactionSchema.extend({
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
});

const PayCommitmentSchema = z.object({
    transactionId: z.string(),
    userId: z.string(), // The user performing the action
    paymentDetails: z.object({
        paymentMethod: z.string(),
        paymentReference: z.string().optional(),
        paymentVoucherUrl: z.string().optional(),
    }),
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
 * This flow now includes the definitive commission logic and cashier tracking.
 */
export const processDirectPayment = ai.defineFlow(
    {
        name: 'processDirectPaymentFlow',
        inputSchema: ProcessDirectPaymentSchema,
        outputSchema: z.object({ transactionId: z.string() }),
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

        if (!session.amount) {
            throw new Error("Invalid session data: amount is missing.");
        }
        
        const clientRef = doc(db, 'users', session.clientId);
        const clientSnap = await getDoc(clientRef);
        if (!clientSnap.exists()) throw new Error("Client not found for commission calculation");
        const client = clientSnap.data() as User;

        const providerRef = doc(db, 'users', session.providerId);
        const providerSnap = await getDoc(providerRef);
        if (!providerSnap.exists()) throw new Error("Provider not found");
        const provider = providerSnap.data() as User;
        
        // --- NEW Commission and Tax Logic ---
        // The commission is a commitment FROM the provider TO Corabo
        const { rate: exchangeRate } = await getExchangeRate();
        const isCompany = provider.profileSetupData?.providerType === 'company';
        
        // 1. Determine Commission Rate based on Provider type and subscription
        let commissionRate = isCompany ? 0.06 : 0.04; // 6% for companies, 4% for professionals
        if (provider.isSubscribed) {
            commissionRate = isCompany ? 0.05 : 0.03; // Reduced rates for subscribers
        }
        
        const baseAmount = session.amount; // Base sale amount in local currency
        
        // 2. Calculate commission and its respective tax
        const commissionAmount = baseAmount * commissionRate;
        const taxRate = 0.16; // 16% IVA for Venezuela
        const taxAmountOnCommission = commissionAmount * taxRate; // IVA is ONLY on the commission
        const providerCommitmentAmount = commissionAmount + taxAmountOnCommission;

        // 3. The client pays ONLY the base amount of the sale
        const finalAmountClientPays = baseAmount;
        // --- End of New Logic ---


        // 1. Create the main transaction for the initial payment
        const initialTxId = `txndp-${sessionId}`;
        const initialTransaction: Transaction = {
            id: initialTxId,
            type: 'Compra Directa',
            status: 'Pagado', // Status is directly Pagado as it's a direct payment
            date: new Date().toISOString(),
            amount: finalAmountClientPays, // The client pays the sale amount
            participantIds: [session.clientId, session.providerId],
            clientId: session.clientId,
            providerId: session.providerId,
            details: {
                paymentMethod: session.financedAmount && session.financedAmount > 0 ? 'credicora' : 'direct',
                initialPayment: session.initialPayment,
                financedAmount: session.financedAmount,
                paymentVoucherUrl: session.voucherUrl,
                system: `Venta por ${baseAmount.toFixed(2)}`,
                baseAmount: baseAmount,
                exchangeRate,
                amountUSD: baseAmount / exchangeRate,
                cashierBoxId: session.cashierBoxId,
                cashierName: session.cashierName,
            }
        };
        batch.set(doc(db, 'transactions', initialTxId), initialTransaction);
        
        // 2. Create the separate commission commitment transaction FOR THE PROVIDER
        const commissionTxId = `txn-comm-${initialTxId}`;
        const commissionDueDate = endOfMonth(new Date()); // Due at the end of the current month
        
        // CORRECTED LOGIC: Create details object first
        const commissionDetails = {
            system: `Comisión de servicio por Venta (Tx: ${initialTxId.slice(-6)})`,
            baseAmount: commissionAmount,
            tax: taxAmountOnCommission,
            taxRate,
            commissionRate,
        };
        
        const commissionTransaction: Transaction = {
            id: commissionTxId,
            type: 'Sistema',
            status: 'Finalizado - Pendiente de Pago',
            date: commissionDueDate.toISOString(),
            amount: providerCommitmentAmount,
            clientId: session.providerId, // The provider is the "client" for this debt
            providerId: 'corabo-admin',   // Corabo is the "provider" of the service
            participantIds: [session.providerId, 'corabo-admin'],
            details: commissionDetails,
        };
        batch.set(doc(db, 'transactions', commissionTxId), commissionTransaction);

        // 3. Create client's installment transactions if financed with Credicora
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

            // 4. Update client's Credicora limit
            const newCredicoraLimit = (client.credicoraLimit || 0) - session.financedAmount;
            batch.update(clientRef, { credicoraLimit: newCredicoraLimit });
        }
        
        await batch.commit();
        
        return { transactionId: initialTxId };
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
    const db = getFirestoreDb();
    const txRef = doc(db, 'transactions', transactionId);
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
        const db = getFirestoreDb();
        const txRef = doc(db, 'transactions', transactionId);
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
        
        const { rate } = await getExchangeRate();

        await updateDoc(txRef, { 
            status: 'Finalizado - Pendiente de Pago',
            'details.clientRating': rating,
            'details.clientComment': comment || '',
            'details.exchangeRate': rate,
            'details.amountUSD': transaction.amount / rate,
            'details.paymentRequestedAt': new Date().toISOString(), // Record when payment is formally requested
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
    async ({ transactionId, userId, paymentDetails }) => {
        const db = getFirestoreDb();
        const txRef = doc(db, 'transactions', transactionId);
        const txSnap = await getDoc(txRef);
        if (!txSnap.exists()) throw new Error("Transaction not found.");

        const transaction = txSnap.data() as Transaction;

        // SECURITY CHECK: Only the client can pay.
        if (transaction.clientId !== userId) {
            throw new Error("Permission denied. User is not the client for this transaction.");
        }
        
        const updateData: any = { 
            status: 'Pago Enviado - Esperando Confirmación',
            'details.paymentMethod': paymentDetails.paymentMethod,
            'details.paymentReference': paymentDetails.paymentReference,
            'details.paymentVoucherUrl': paymentDetails.paymentVoucherUrl,
            'details.paymentSentAt': new Date().toISOString(), // Record when client sends payment
        };

        await updateDoc(txRef, updateData);
    }
);

/**
 * Provider confirms they have received the payment.
 * The transaction status changes to 'Pagado' or 'Resuelto'.
 * Rewards the client with +2 effectiveness points.
 */
export const confirmPaymentReceived = ai.defineFlow(
    {
        name: 'confirmPaymentReceivedFlow',
        inputSchema: z.object({ transactionId: z.string(), userId: z.string(), fromThirdParty: z.boolean() }),
        outputSchema: z.void(),
    },
    async ({ transactionId, userId, fromThirdParty }) => {
        const db = getFirestoreDb();
        const batch = writeBatch(db);
        
        const txRef = doc(db, 'transactions', transactionId);
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
        
        // Update transaction status
        batch.update(txRef, { 
            status: 'Pagado',
            'details.paymentFromThirdParty': fromThirdParty,
        });

        // Reward the client for paying on time
        const clientRef = doc(db, 'users', transaction.clientId);
        batch.update(clientRef, { effectiveness: increment(2) });

        await batch.commit();
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
        const db = getFirestoreDb();
        const txRef = doc(db, 'transactions', transactionId);
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
        const db = getFirestoreDb();
        const txRef = doc(db, 'transactions', transactionId);
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
        const db = getFirestoreDb();
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
        const txRef = doc(db, 'transactions', txId);
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
        const db = getFirestoreDb();
        const txRef = doc(db, 'transactions', transactionId);
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
        const db = getFirestoreDb();
        // SECURITY: In a real app, we'd check if the user calling this is a participant.
        const txRef = doc(db, 'transactions', transactionId);
        await updateDoc(txRef, { status: 'En Disputa' });
    }
);

/**
 * Removes a system-generated transaction, such as a renewable subscription payment.
 */
export async function cancelSystemTransaction(transactionId: string) {
    const db = getFirestoreDb();
    const txRef = doc(db, 'transactions', transactionId);
    await deleteDoc(txRef);
}

/**
 * Placeholder for a flow that would generate a PDF of transactions.
 */
export const downloadTransactionsPDF = ai.defineFlow(
    {
        name: 'downloadTransactionsPDFFlow',
        inputSchema: z.array(z.any()), // Expects an array of transactions
        outputSchema: z.string(), // Returns a base64 string of the PDF
    },
    async (transactions) => {
        // In a real implementation, you would use a library like jsPDF or Puppeteer
        // on the server to generate a PDF from the transaction data.
        // For this prototype, we'll return a placeholder string.
        console.log("Generating PDF for", transactions.length, "transactions.");
        return "base64-encoded-pdf-string-placeholder";
    }
);

/**
 * Handles the logic for checking out items from the cart.
 * This flow now creates a transaction with status 'Buscando Repartidor'.
 */
export const checkout = ai.defineFlow({
    name: 'checkoutFlow',
    inputSchema: z.object({
        userId: z.string(),
        providerId: z.string(),
        deliveryMethod: z.string(),
        useCredicora: z.boolean(),
        recipientInfo: z.object({ name: z.string(), phone: z.string() }).optional(),
        deliveryAddress: z.string().optional(),
    }),
    outputSchema: z.void(),
}, async ({ userId, providerId, deliveryMethod, useCredicora, recipientInfo, deliveryAddress }) => {
    const db = getFirestoreDb();
    
    // 1. Find the active cart for this user and provider
    const q = query(
        collection(db, 'transactions'), 
        where('clientId', '==', userId), 
        where('providerId', '==', providerId), 
        where('status', '==', 'Carrito Activo')
    );
    const snapshot = await getDocs(q);
    const cartTxDoc = snapshot.docs[0];
    
    if (!cartTxDoc) {
        throw new Error("Cart not found for checkout.");
    }
    
    const cartTx = cartTxDoc.data() as Transaction;
    
    // 2. Define delivery details
    const deliveryDetails = {
        delivery: deliveryMethod !== 'pickup',
        method: deliveryMethod,
        address: deliveryAddress,
        recipientInfo: recipientInfo,
    };
    
    // 3. Update the transaction from a 'Cart' to a pending 'Delivery'
    await updateDoc(doc(db, 'transactions', cartTx.id), {
        status: 'Buscando Repartidor',
        'details.delivery': deliveryDetails,
        'details.deliveryCost': 1.5, // Placeholder cost
        'details.paymentMethod': useCredicora ? 'credicora' : 'direct',
    });

    // 4. Trigger the delivery provider search flow if needed
    if (deliveryMethod !== 'pickup') {
        // We call this flow but don't wait for it to complete.
        // It will run in the background.
        ai.runFlow(findDeliveryProvider, { transactionId: cartTx.id });
    }
});
