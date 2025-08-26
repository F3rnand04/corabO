'use server';

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
    cancelSystemTransactionFlow,
} from '@/ai/flows/transaction-flow';

import { 
    findDeliveryProviderFlow, 
    resolveDeliveryAsPickupFlow 
} from '@/ai/flows/delivery-flow';
import { revalidatePath } from 'next/cache';
import type { AppointmentRequest, Transaction, User } from '@/lib/types';


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
    // This flow is currently a placeholder and does not generate a real PDF.
    // To implement, you would use a library like jspdf and html2canvas.
    // For now, we return a placeholder string.
    console.log("Generating PDF for", transactions.length, "transactions.");
    return "base64-encoded-pdf-string-placeholder";
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
    // This would ideally be a dedicated flow, but for now we can simulate the logic here or in a new flow.
    // For now, let's assume a flow exists or logic is handled directly.
    console.log(`Assigning delivery for TX ${transactionId} to provider ${providerId} themselves.`);
    // await assignSelfDeliveryFlow({ transactionId, providerId });
    revalidatePath('/transactions');
}

export async function resolveDeliveryAsPickup(input: { transactionId: string }) {
    await resolveDeliveryAsPickupFlow(input);
    revalidatePath('/transactions');
}
