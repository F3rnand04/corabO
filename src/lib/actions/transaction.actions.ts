'use server';

import { revalidatePath } from 'next/cache';
import { createQuoteRequestFlow, createTransactionFlow } from '@/ai/flows/transaction-flow';
import type { Transaction, QuoteRequestInput, AgreementProposal } from '@/lib/types';
import { getFirebaseStorage, getFirebaseFirestore } from '@/lib/firebase-admin';
import { 
    createAppointmentRequestFlow, 
    acceptAppointmentFlow, 
    acceptQuoteFlow, 
    checkoutFlow, 
    completeWorkFlow, 
    confirmPaymentReceivedFlow, 
    confirmWorkReceivedFlow, 
    payCommitmentFlow, 
    processDirectPaymentFlow, 
    sendQuoteFlow, 
    startDisputeFlow, 
    cancelSystemTransactionFlow
} from '@/ai/flows/transaction-flow';

/**
 * Uploads a file (as a data URL) to a specified path in Firebase Storage.
 * @param filePath The desired path in the storage bucket.
 * @param dataUrl The base64 encoded data URL of the file.
 * @returns The public URL of the uploaded file.
 */
async function uploadToStorage(filePath: string, dataUrl: string): Promise<string> {
    const storage = getFirebaseStorage();
    const bucket = storage.bucket();

    // Extract content type and base64 data from data URL
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        throw new Error('Invalid data URL format.');
    }
    const contentType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const file = bucket.file(filePath);

    // Upload the file
    await file.save(buffer, {
        metadata: {
            contentType: contentType,
        },
    });

    // Make the file public and return its URL
    await file.makePublic();
    
    return file.publicUrl();
}


export async function createAppointmentRequest(request: { providerId: string; clientId: string; date: string; details: string; amount: number; }) {
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
    await checkoutFlow({ userId, providerId, deliveryMethod, useCredicora, recipientInfo, deliveryAddress: deliveryAddress || undefined });
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
    
    let uploadedVoucherUrl = paymentDetails.paymentVoucherUrl;

    // If a new voucher data URL is provided, upload it to storage
    if (paymentDetails.paymentVoucherUrl && paymentDetails.paymentVoucherUrl.startsWith('data:')) {
        const filePath = `vouchers/${userId}/${transactionId}-${Date.now()}`;
        uploadedVoucherUrl = await uploadToStorage(filePath, paymentDetails.paymentVoucherUrl);
    }
    
    await payCommitmentFlow({ transactionId, userId, paymentDetails: {...paymentDetails, paymentVoucherUrl: uploadedVoucherUrl} });
    revalidatePath('/transactions');
    revalidatePath('/payment');
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

export async function processDirectPayment(sessionId: string) {
    const db = getFirebaseFirestore();
    const sessionRef = db.collection('qr_sessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) throw new Error("Session not found for payment processing");
    
    const result = await processDirectPaymentFlow({ sessionId });

    revalidatePath('/transactions');
    return result;
}

export async function createQuoteRequest(input: QuoteRequestInput): Promise<{ requiresPayment: boolean; newTransaction: Transaction | null }> {
    return await createQuoteRequestFlow(input);
}

export async function purchaseGift(userId: string, gift: { id: string, name: string, price: number }) {
    const newTransaction = await createTransactionFlow({
        type: 'Sistema',
        status: 'Finalizado - Pendiente de Pago',
        date: new Date().toISOString(),
        amount: gift.price,
        clientId: userId,
        providerId: 'corabo-admin',
        participantIds: [userId, 'corabo-admin'],
        details: {
            system: `Compra de regalo: ${gift.name}`,
        },
    });
    
    const paymentUrl = `/payment?commitmentId=${'${newTransaction.id}'}`;

    return { paymentUrl };
}

// --- New Actions for Collections Management ---

/**
 * Marks a collection case as resolved by an admin.
 */
export async function resolveCollectionCase(transactionId: string) {
    const db = getFirebaseFirestore();
    await db.collection('transactions').doc(transactionId).update({ status: 'Resuelto' });
    revalidatePath('/admin');
}

/**
 * Marks a debt as uncollectible by an admin.
 */
export async function writeOffDebt(transactionId: string) {
    const db = getFirebaseFirestore();
    await db.collection('transactions').doc(transactionId).update({ status: 'Incobrable' });
    revalidatePath('/admin');
}
