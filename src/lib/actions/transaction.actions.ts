'use server';

import { getFirebaseAdmin } from '@/lib/firebase-server';
getFirebaseAdmin(); // Ensure Firebase is initialized

import { revalidatePath } from 'next/cache';
import type { AppointmentRequest, Transaction, User } from '@/lib/types';
import { 
    createAppointmentRequestFlow, 
    acceptAppointmentFlow, 
    acceptQuoteFlow, 
    checkoutFlow, 
    completeWorkFlow, 
    confirmPaymentReceivedFlow, 
    confirmWorkReceivedFlow, 
    downloadTransactionsPDFFlow, 
    payCommitmentFlow, 
    processDirectPaymentFlow, 
    sendQuoteFlow, 
    startDisputeFlow, 
    cancelSystemTransactionFlow 
} from '@/ai/flows/transaction-flow';
import { findDeliveryProviderFlow, resolveDeliveryAsPickupFlow } from '@/ai/flows/delivery-flow';


export async function createAppointmentRequest(request: AppointmentRequest) {
    await createAppointmentRequestFlow(request);
    revalidatePath('/transactions');
}

export async function acceptAppointment(input: { transactionId: string, userId: string }) {
    await acceptAppointmentFlow(input);
    revalidatePath('/transactions');
}

export async function acceptQuote(input: { transactionId: string, userId: string }) {
    await acceptQuoteFlow(input);
    revalidatePath('/transactions');
}

export async function checkout(
    userId: string, 
    providerId: string, 
    deliveryMethod: string, 
    useCredicora: boolean, 
    recipientInfo: { name: string; phone: string } | undefined, 
    deliveryAddress: string
) {
    await checkoutFlow({ userId, providerId, deliveryMethod, useCredicora, recipientInfo, deliveryAddress });
    revalidatePath('/transactions');
    revalidatePath('/cart'); // Assuming a cart page or component
}

export async function completeWork(input: { transactionId: string, userId: string }) {
    await completeWorkFlow(input);
    revalidatePath('/transactions');
}

export async function confirmWorkReceived(input: { transactionId: string, userId: string, rating: number, comment?: string }) {
    await confirmWorkReceivedFlow(input);
    revalidatePath('/transactions');
}

export async function payCommitment(transactionId: string, userId: string, paymentDetails: { paymentMethod: string, paymentReference?: string, paymentVoucherUrl?: string }) {
    await payCommitmentFlow({ transactionId, userId, paymentDetails });
    revalidatePath('/transactions');
}

export async function confirmPaymentReceived(input: { transactionId: string, userId: string, fromThirdParty: boolean }) {
    await confirmPaymentReceivedFlow(input);
    revalidatePath('/transactions');
}

export async function sendQuote(input: { transactionId: string, userId: string, breakdown: string, total: number }) {
    await sendQuoteFlow(input);
    revalidatePath('/transactions');
}

export async function startDispute(transactionId: string) {
    await startDisputeFlow(transactionId);
    revalidatePath('/transactions');
}

export async function cancelSystemTransaction(transactionId: string) {
    await cancelSystemTransactionFlow(transactionId);
    revalidatePath('/transactions');
}

export async function downloadTransactionsPDF(transactions: Transaction[]) {
    return await downloadTransactionsPDFFlow(transactions);
}


export async function processDirectPayment(sessionId: string) {
    const result = await processDirectPaymentFlow({ sessionId });
    revalidatePath('/transactions');
    return result;
}

// Delivery related actions, forwarded from transaction context
export async function retryFindDelivery(input: { transactionId: string }) {
    await findDeliveryProviderFlow(input);
    revalidatePath('/transactions');
}

export async function assignOwnDelivery(transactionId: string, providerId: string) {
    console.log(`Assigning delivery for TX ${transactionId} to provider ${providerId} themselves.`);
    revalidatePath('/transactions');
}

export async function resolveDeliveryAsPickup(input: { transactionId: string }) {
    await resolveDeliveryAsPickupFlow(input);
    revalidatePath('/transactions');
}
