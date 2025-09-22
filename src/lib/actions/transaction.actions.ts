
'use server';

import { revalidatePath } from 'next/cache';
import { createTransactionFlow } from '@/ai/flows/transaction-flow';
import type { Transaction, QuoteRequestInput, AgreementProposal } from '@/lib/types';
import { getFirebaseStorage, getFirebaseFirestore } from '@/lib/firebase-admin';
import type { Storage } from 'firebase-admin/storage';
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
    cancelSystemTransactionFlow,
    createQuoteRequestFlow
} from '@/ai/flows/transaction-flow';

/**
 * Uploads a file (as a data URL) to a specified path in Firebase Storage.
 * This is a helper function isolated from client-side code.
 * @param storage - The Firebase Admin Storage instance (injected).
 * @param filePath The desired path in the storage bucket.
 * @param dataUrl The base64 encoded data URL of the file.
 * @returns The public URL of the uploaded file.
 */
async function uploadToStorage(storage: Storage, filePath: string, dataUrl: string): Promise<string> {
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
    const db = getFirebaseFirestore();
    await createAppointmentRequestFlow(db, request);
    revalidatePath('/transactions');
}

export async function acceptAppointment(input: { transactionId: string, userId: string }) {
    const db = getFirebaseFirestore();
    await acceptAppointmentFlow(db, input);
    revalidatePath('/transactions');
}

export async function acceptQuote(input: { transactionId: string, userId: string }) {
    const db = getFirebaseFirestore();
    await acceptQuoteFlow(db, input);
    revalidatePath('/transactions');
}

export async function checkout(
    userId: string, 
    providerId: string, 
    deliveryMethod: string, 
    useCredicora: boolean, 
    recipientInfo: { name: string; phone: string } | null, 
    deliveryAddress: string
) {
    const db = getFirebaseFirestore();
    await checkoutFlow(db, { userId, providerId, deliveryMethod, useCredicora, recipientInfo: recipientInfo || undefined, deliveryAddress: deliveryAddress || undefined });
    revalidatePath('/transactions');
    revalidatePath('/cart'); // Assuming a cart page or component
}

export async function completeWork(input: { transactionId: string, userId: string }) {
    const db = getFirebaseFirestore();
    await completeWorkFlow(db, input);
    revalidatePath('/transactions');
}

export async function confirmWorkReceived(input: { transactionId: string, userId: string, rating: number, comment?: string }) {
    const db = getFirebaseFirestore();
    await confirmWorkReceivedFlow(db, input);
    revalidatePath('/transactions');
}

export async function payCommitment(transactionId: string, userId: string, paymentDetails: { paymentMethod: string, paymentReference?: string, paymentVoucherUrl?: string }) {
    
    let uploadedVoucherUrl = paymentDetails.paymentVoucherUrl;

    // If a new voucher data URL is provided, upload it to storage
    if (paymentDetails.paymentVoucherUrl && paymentDetails.paymentVoucherUrl.startsWith('data:')) {
        const storage = getFirebaseStorage(); // Get storage instance here
        const filePath = `vouchers/${userId}/${transactionId}-${Date.now()}`;
        uploadedVoucherUrl = await uploadToStorage(storage, filePath, paymentDetails.paymentVoucherUrl);
    }
    
    const db = getFirebaseFirestore();
    await payCommitmentFlow(db, { transactionId, userId, paymentDetails: {...paymentDetails, paymentVoucherUrl: uploadedVoucherUrl} });
    revalidatePath('/transactions');
    revalidatePath('/payment');
}

export async function confirmPaymentReceived(input: { transactionId: string, userId: string, fromThirdParty: boolean }) {
    const db = getFirebaseFirestore();
    await confirmPaymentReceivedFlow(db, input);
    revalidatePath('/transactions');
}

export async function sendQuote(input: { transactionId: string, userId: string, breakdown: string, total: number }) {
    const db = getFirebaseFirestore();
    await sendQuoteFlow(db, input);
    revalidatePath('/transactions');
}

export async function startDispute(transactionId: string) {
    const db = getFirebaseFirestore();
    await startDisputeFlow(db, transactionId);
    revalidatePath('/transactions');
}

export async function cancelSystemTransaction(transactionId: string) {
    const db = getFirebaseFirestore();
    await cancelSystemTransactionFlow(db, transactionId);
    revalidatePath('/transactions');
}

export async function processDirectPayment(sessionId: string) {
    const db = getFirebaseFirestore();
    const result = await processDirectPaymentFlow(db, { sessionId });

    revalidatePath('/transactions');
    return result;
}

export async function createQuoteRequest(input: QuoteRequestInput): Promise<{ requiresPayment: boolean; newTransaction: Transaction | null }> {
    const db = getFirebaseFirestore();
    return await createQuoteRequestFlow(db, input);
}

export async function purchaseGift(userId: string, gift: { id: string, name: string, price: number }) {
    const db = getFirebaseFirestore();
    const newTransaction = await createTransactionFlow(db, {
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
    
    const paymentUrl = `/payment?commitmentId=${newTransaction.id}`;

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
