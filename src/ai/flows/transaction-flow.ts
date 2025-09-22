'use server';

/**
 * @fileOverview Transaction management flows.
 */
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Transaction, User, QrSession, QuoteRequestInput } from '@/lib/types';
import { addDays, endOfMonth, isAfter, startOfWeek } from 'date-fns';
import { getExchangeRate } from './exchange-rate-flow';
import { findDeliveryProviderFlow, calculateDeliveryCostFlow } from './delivery-flow';
import { sendNotification } from './notification-flow';
import { haversineDistance } from '@/lib/utils';
import { countries } from '@/lib/data/options';


// --- Schemas ---

const BasicTransactionSchema = z.object({
  transactionId: z.string(),
  userId: z.string(),
});
type BasicTransactionInput = z.infer<typeof BasicTransactionSchema>;

const ConfirmWorkReceivedSchema = BasicTransactionSchema.extend({
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
});
type ConfirmWorkReceivedInput = z.infer<typeof ConfirmWorkReceivedSchema>;


const PayCommitmentSchema = z.object({
    transactionId: z.string(),
    userId: z.string(),
    paymentDetails: z.object({
        paymentMethod: z.string(),
        paymentReference: z.string().optional(),
        paymentVoucherUrl: z.string().optional(),
    }),
});
type PayCommitmentInput = z.infer<typeof PayCommitmentSchema>;


const SendQuoteSchema = BasicTransactionSchema.extend({
    breakdown: z.string(),
    total: z.number(),
});
type SendQuoteInput = z.infer<typeof SendQuoteSchema>;


const AppointmentRequestSchema = z.object({
    providerId: z.string(),
    clientId: z.string(),
    date: z.string(),
    details: z.string(),
    amount: z.number(),
});
type AppointmentRequestInput = z.infer<typeof AppointmentRequestSchema>;

const ProcessDirectPaymentSchema = z.object({
  sessionId: z.string(),
});
type ProcessDirectPaymentInput = z.infer<typeof ProcessDirectPaymentSchema>;

const ConfirmPaymentReceivedSchema = z.object({
    transactionId: z.string(),
    userId: z.string(),
    fromThirdParty: z.boolean(),
});
type ConfirmPaymentReceivedInput = z.infer<typeof ConfirmPaymentReceivedSchema>;

const CheckoutInputSchema = z.object({
    userId: z.string(),
    providerId: z.string(),
    deliveryMethod: z.string(),
    useCredicora: z.boolean(),
    recipientInfo: z.object({ name: z.string(), phone: z.string() }).optional(),
    deliveryAddress: z.string().optional(),
});
type CheckoutInput = z.infer<typeof CheckoutInputSchema>;


// --- Flows ---

export async function processDirectPaymentFlow(input: ProcessDirectPaymentInput): Promise<{ transactionId: string }> {
    const db = getFirestore();
    const batch = db.batch();

    const sessionRef = db.collection('qr_sessions').doc(input.sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
        throw new Error("QR Session not found");
    }
    const session = sessionSnap.data() as QrSession;

    if (!session.amount) {
        throw new Error("Invalid session data: amount is missing.");
    }
    
    if (!session.clientId) {
      throw new Error("Invalid session data: client ID is missing.");
    }
    
    const clientRef = db.collection('users').doc(session.clientId);
    const clientSnap = await clientRef.get();
    if (!clientSnap.exists) throw new Error("Client not found for commission calculation");
    const client = clientSnap.data() as User;

    const providerRef = db.collection('users').doc(session.providerId);
    const providerSnap = await providerRef.get();
    if (!providerSnap.exists) throw new Error("Provider not found");
    const provider = providerSnap.data() as User;
    
    const { rate: exchangeRate } = await getExchangeRate();
    const isCompany = provider.profileSetupData?.providerType === 'company';
    
    let commissionRate = isCompany ? 0.06 : 0.04;
    if (provider.isSubscribed) {
        commissionRate = isCompany ? 0.05 : 0.03;
    }
    
    const baseAmount = session.amount;
    const countryInfo = countries.find(c => c.code === provider.country);
    const taxRate = countryInfo?.ivaRate || 0.16;
    const commissionAmount = baseAmount * commissionRate;
    const taxAmountOnCommission = commissionAmount * taxRate;
    const providerCommitmentAmount = commissionAmount + taxAmountOnCommission;

    const initialTxId = `txndp-${input.sessionId}`;
    const initialTransaction: Transaction = {
        id: initialTxId,
        type: 'Compra Directa',
        status: 'Pagado',
        date: new Date().toISOString(),
        amount: baseAmount,
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
            commissionRate,
            taxRate,
            commission: commissionAmount,
            tax: taxAmountOnCommission
        }
    };
    batch.set(db.collection('transactions').doc(initialTxId), initialTransaction);
    
    const commissionTxId = `txn-comm-${initialTxId}`;
    const commissionDueDate = endOfMonth(new Date());
    
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
        clientId: session.providerId,
        providerId: 'corabo-admin',
        participantIds: [session.providerId, 'corabo-admin'],
        details: commissionDetails,
    };
    batch.set(db.collection('transactions').doc(commissionTxId), commissionTransaction);

    if (session.financedAmount && session.installments && session.financedAmount > 0) {
        const installmentAmount = session.financedAmount / session.installments;
        for (let i = 1; i <= session.installments; i++) {
            const installmentTxId = `txn-credicora-${input.sessionId.slice(-4)}-${i}`;
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
            batch.set(db.collection('transactions').doc(installmentTxId), installmentTx);
        }

        const newCredicoraLimit = (client.credicoraLimit || 0) - session.financedAmount;
        batch.update(clientRef, { credicoraLimit: newCredicoraLimit });
    }
    
    await batch.commit();
    
    return { transactionId: initialTxId };
}



export async function completeWorkFlow(input: BasicTransactionInput) {
    const db = getFirestore();
    const txRef = db.collection('transactions').doc(input.transactionId);
    const txSnap = await txRef.get();
    if (!txSnap.exists) throw new Error("Transaction not found.");
    
    const transaction = txSnap.data() as Transaction;
    if (transaction.providerId !== input.userId) {
        throw new Error("Permission denied.");
    }
    if (transaction.status !== 'Acuerdo Aceptado - Pendiente de Ejecución') {
        throw new Error("Invalid action.");
    }
    await txRef.update({ status: 'Pendiente de Confirmación del Cliente' });
  }


export async function confirmWorkReceivedFlow(input: ConfirmWorkReceivedInput) {
    const db = getFirestore();
    const txRef = db.collection('transactions').doc(input.transactionId);
    const txSnap = await txRef.get();
    if (!txSnap.exists) throw new Error("Transaction not found.");

    const transaction = txSnap.data() as Transaction;
    if (transaction.clientId !== input.userId) {
        throw new Error("Permission denied.");
    }
    if (transaction.status !== 'Pendiente de Confirmación del Cliente') {
        throw new Error("Invalid action.");
    }
    
    const { rate } = await getExchangeRate();

    await txRef.update({ 
        status: 'Finalizado - Pendiente de Pago',
        'details.clientRating': input.rating,
        'details.clientComment': input.comment || '',
        'details.exchangeRate': rate,
        'details.amountUSD': transaction.amount / rate,
        'details.paymentRequestedAt': new Date().toISOString(),
    });
}


export async function payCommitmentFlow(input: PayCommitmentInput) {
    const db = getFirestore();
    const txRef = db.collection('transactions').doc(input.transactionId);
    const txSnap = await txRef.get();
    if (!txSnap.exists) throw new Error("Transaction not found.");

    const transaction = txSnap.data() as Transaction;
    if (transaction.clientId !== input.userId) {
        throw new Error("Permission denied.");
    }
    
    await txRef.update({ 
        status: 'Pago Enviado - Esperando Confirmación',
        'details.paymentMethod': input.paymentDetails.paymentMethod,
        'details.paymentReference': input.paymentDetails.paymentReference,
        'details.paymentVoucherUrl': input.paymentDetails.paymentVoucherUrl,
        'details.paymentSentAt': new Date().toISOString(),
    });
}


export async function confirmPaymentReceivedFlow(input: ConfirmPaymentReceivedInput) {
    const db = getFirestore();
    const batch = db.batch();
    
    const txRef = db.collection('transactions').doc(input.transactionId);
    const txSnap = await txRef.get();
    if (!txSnap.exists) throw new Error("Transaction not found.");
    
    const transaction = txSnap.data() as Transaction;
    if (transaction.providerId !== input.userId) {
        throw new Error("Permission denied.");
    }
    if (transaction.status !== 'Pago Enviado - Esperando Confirmación') {
        throw new Error("Invalid action.");
    }
    
    batch.update(txRef, { 
        status: 'Pagado',
        'details.paymentFromThirdParty': input.fromThirdParty,
    });

    const clientRef = db.collection('users').doc(transaction.clientId);
    batch.update(clientRef, { effectiveness: FieldValue.increment(2) });

    await batch.commit();
}


export async function sendQuoteFlow(input: SendQuoteInput) {
    const db = getFirestore();
    const txRef = db.collection('transactions').doc(input.transactionId);
    const txSnap = await txRef.get();
    if (!txSnap.exists) throw new Error("Transaction not found.");
    
    const transaction = txSnap.data() as Transaction;
    if (transaction.providerId !== input.userId) {
        throw new Error("Permission denied.");
    }
    if (transaction.status !== 'Solicitud Pendiente') {
        throw new Error("Invalid action.");
    }
    await txRef.update({
        status: 'Cotización Recibida',
        amount: input.total,
        'details.quote': { breakdown: input.breakdown, total: input.total },
    });
}


export async function acceptQuoteFlow(input: BasicTransactionInput) {
    const db = getFirestore();
    const txRef = db.collection('transactions').doc(input.transactionId);
    const txSnap = await txRef.get();
    if (!txSnap.exists) throw new Error("Transaction not found.");
    
    const transaction = txSnap.data() as Transaction;
    if (transaction.clientId !== input.userId) {
        throw new Error("Permission denied.");
    }
    if (transaction.status !== 'Cotización Recibida') {
        throw new Error("Invalid action.");
    }
    await txRef.update({ status: 'Finalizado - Pendiente de Pago' });
}


export async function createTransactionFlow(txData: Omit<Transaction, 'id'>): Promise<Transaction> {
    const db = getFirestore();
    const txId = `txn-sys-${Date.now()}`;
    const newTransaction: Transaction = {
      id: txId,
      ...txData,
    };
    const txRef = db.collection('transactions').doc(txId);
    await txRef.set(newTransaction);
    
    if (txData.details.isSubscription) {
        await db.collection('users').doc(txData.clientId).update({ isSubscribed: true });
    }

    return newTransaction;
}



export async function createAppointmentRequestFlow(request: AppointmentRequestInput) {
    const db = getFirestore();
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
    const txRef = db.collection('transactions').doc(txId);
    await txRef.set(newTransaction);
}


export async function acceptAppointmentFlow(input: BasicTransactionInput) {
    const db = getFirestore();
    const txRef = db.collection('transactions').doc(input.transactionId);
    const txSnap = await txRef.get();
    if (!txSnap.exists) throw new Error("Transaction not found.");

    const transaction = txSnap.data() as Transaction;
    if (transaction.providerId !== input.userId) {
        throw new Error("Permission denied.");
    }
    if (transaction.status !== 'Cita Solicitada') {
        throw new Error("Invalid action.");
    }
    await txRef.update({ status: 'Acuerdo Aceptado - Pendiente de Ejecución' });
}



export async function startDisputeFlow(transactionId: string) {
    const db = getFirestore();
    const txRef = db.collection('transactions').doc(transactionId);
    await txRef.update({ status: 'En Disputa' });
}


export async function cancelSystemTransactionFlow(transactionId: string) {
    const db = getFirestore();
    const txRef = db.collection('transactions').doc(transactionId);
    await txRef.delete();
}

export async function checkoutFlow(input: CheckoutInput) {
    const db = getFirestore();
    const batch = db.batch();

    const q = db.collection('transactions')
        .where('clientId', '==', input.userId)
        .where('providerId', '==', input.providerId)
        .where('status', '==', 'Carrito Activo');
    const snapshot = await q.get();
    const cartTxDoc = snapshot.docs[0];

    if (!cartTxDoc) {
        throw new Error("Cart not found for checkout.");
    }

    const cartTxRef = cartTxDoc.ref;
    const cartTx = cartTxDoc.data() as Transaction;
    const clientRef = db.collection('users').doc(input.userId);
    const clientSnap = await clientRef.get();
    const client = clientSnap.data() as User;
    
    const providerRef = db.collection('users').doc(input.providerId);
    const providerSnap = await providerRef.get();
    const provider = providerSnap.data() as User;

    let financedAmount = 0;
    let initialPayment = cartTx.amount;
    let installments = 0;
    
    if (input.useCredicora && client.credicoraDetails) {
        const potentialFinancing = cartTx.amount * (1 - client.credicoraDetails.initialPaymentPercentage);
        financedAmount = Math.min(potentialFinancing, client.credicoraLimit || 0);
        initialPayment = cartTx.amount - financedAmount;
        installments = client.credicoraDetails.installments;

        if (financedAmount > 0) {
            const newCredicoraLimit = (client.credicoraLimit || 0) - financedAmount;
            batch.update(clientRef, { credicoraLimit: newCredicoraLimit });

            const installmentAmount = financedAmount / installments;
            for (let i = 1; i <= installments; i++) {
                const installmentTxId = `txn-credicora-cart-${cartTx.id.slice(-4)}-${i}`;
                const dueDate = addDays(new Date(), i * 15);
                const installmentTx: Transaction = {
                    id: installmentTxId,
                    type: 'Sistema',
                    status: 'Finalizado - Pendiente de Pago',
                    date: dueDate.toISOString(),
                    amount: installmentAmount,
                    clientId: input.userId,
                    providerId: 'corabo-admin',
                    participantIds: [input.userId, 'corabo-admin'],
                    details: {
                        system: `Cuota ${i}/${installments} de Compra`,
                    },
                };
                batch.set(db.collection('transactions').doc(installmentTxId), installmentTx);
            }
        }
    }
    
    const deliveryDetails = {
        method: input.deliveryMethod,
        address: input.deliveryAddress,
        recipientInfo: input.recipientInfo,
    };

    let deliveryCost = 0;
    if (input.deliveryMethod !== 'pickup' && provider?.profileSetupData?.location && client.profileSetupData?.location) {
        const [provLat, provLon] = provider.profileSetupData.location.split(',').map(Number);
        const [clientLat, clientLon] = client.profileSetupData.location.split(',').map(Number);
        const distance = haversineDistance(provLat, provLon, clientLat, clientLon);
        deliveryCost = await calculateDeliveryCostFlow({ distanceInKm: distance });
    }
    
    batch.update(cartTxRef, {
        status: input.deliveryMethod === 'pickup' ? 'Listo para Retirar en Tienda' : 'Buscando Repartidor',
        'details.delivery': deliveryDetails,
        'details.deliveryCost': deliveryCost,
        'details.paymentMethod': input.useCredicora ? 'credicora' : 'direct',
        'details.financedAmount': financedAmount,
        'details.initialPayment': initialPayment,
        amount: cartTx.amount + deliveryCost
    });

    await batch.commit();

    if (input.deliveryMethod !== 'pickup') {
        // Run delivery search in the background
        findDeliveryProviderFlow({ transactionId: cartTx.id });
    }
}


export async function createQuoteRequestFlow(input: QuoteRequestInput): Promise<{ requiresPayment: boolean; newTransaction: Transaction | null }> {
    const db = getFirestore();
    
    const clientRef = db.collection('users').doc(input.clientId);
    const clientSnap = await clientRef.get();
    if (!clientSnap.exists) throw new Error("Client not found.");
    const client = clientSnap.data() as User;
    
    // Check for free quote eligibility
    const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const hasUsedFreeQuote = client.lastFreeQuoteAt && isAfter(new Date(client.lastFreeQuoteAt), startOfThisWeek);
    
    if (client.isSubscribed || !hasUsedFreeQuote) {
        const txId = `txn-quote-${Date.now()}`;
        const newTransaction: Transaction = {
            id: txId,
            type: 'Cotización',
            status: 'Solicitud Pendiente',
            date: new Date().toISOString(),
            amount: 0,
            clientId: input.clientId,
            providerId: 'corabo-system',
            participantIds: [input.clientId, 'corabo-system'],
            details: {
                serviceName: input.title,
                quote: { breakdown: input.description, total: 0 },
            },
        };
        
        const batch = db.batch();
        batch.set(db.collection('transactions').doc(txId), newTransaction);
        
        if (!client.isSubscribed) {
            batch.update(clientRef, { lastFreeQuoteAt: new Date().toISOString() });
        }

        await sendNotification({
            userId: input.clientId,
            type: 'new_quote_request',
            title: 'Nueva solicitud de cotización',
            message: `Has creado una nueva solicitud de cotización: ${input.title}`,
            link: `/transactions?tx=${txId}`
        });

        
        await batch.commit();
        return { requiresPayment: false, newTransaction };
    } else {
        // User needs to pay
        return { requiresPayment: true, newTransaction: null };
    }
}

    

