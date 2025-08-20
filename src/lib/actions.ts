
'use server';
/**
 * @fileOverview Service Layer for Client-to-Backend Actions
 * This file centralizes all calls to Genkit flows, abstracting the
 * business logic from the UI components and the CoraboContext.
 * This is the ONLY place where flows should be imported.
 */

import { getFirestoreDb } from '@/lib/firebase-server';
import { doc, updateDoc, deleteDoc, setDoc, getDoc, writeBatch, collection, where, query, getDocs, arrayRemove, arrayUnion, deleteField } from 'firebase/firestore';

// Types
import type { User, Product, CartItem, Transaction, GalleryImage, ProfileSetupData, Conversation, Message, AgreementProposal, VerificationOutput, AppointmentRequest, CreatePublicationInput, CreateProductInput, QrSession, CashierBox } from '@/lib/types';

// Flows
import { createCampaign as createCampaignFlow, type CreateCampaignInput } from '@/ai/flows/campaign-flow';
import { sendMessage as sendMessageFlow, acceptProposal as acceptProposalFlow, SendMessageInput } from '@/ai/flows/message-flow';
import * as TransactionFlows from '@/ai/flows/transaction-flow';
import * as NotificationFlows from '@/ai/flows/notification-flow';
import { autoVerifyIdWithAI as autoVerifyIdWithAIFlow, type VerificationInput } from '@/ai/flows/verification-flow';
import { sendSmsVerificationCodeFlow, verifySmsCodeFlow } from '@/ai/flows/sms-flow';
import { createProduct as createProductFlow, createPublication as createPublicationFlow } from '@/ai/flows/publication-flow';
import { findDeliveryProvider as findDeliveryProviderFlow, resolveDeliveryAsPickup as resolveDeliveryAsPickupFlow } from '@/ai/flows/delivery-flow';
import { createCashierBox as createCashierBoxFlow, regenerateCashierQr as regenerateCashierQrFlow } from '@/ai/flows/cashier-flow';
import { requestAffiliation as requestAffiliationFlow, approveAffiliation as approveAffiliationFlow, rejectAffiliation as rejectAffiliationFlow, revokeAffiliation as revokeAffiliationFlow } from '@/ai/flows/affiliation-flow';

// --- User and Profile Actions ---

export async function updateUser(userId: string, updates: Partial<User>) {
    const db = getFirestoreDb();
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
}

export async function updateUserProfileAndGallery(userId: string, image: GalleryImage) {
    const db = getFirestoreDb();
    const userRef = doc(db, 'users', userId);
    const pubRef = doc(db, 'publications', image.id);
    const batch = writeBatch(db);
    batch.update(userRef, { profileImage: image.src });
    batch.set(pubRef, image);
    await batch.commit();
}

export async function updateFullProfile(userId: string, data: ProfileSetupData, profileType: 'client' | 'provider' | 'repartidor') {
    const db = getFirestoreDb();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const existingData = userSnap.data() as User;
    const newProfileSetupData = { ...existingData.profileSetupData, ...data };
    await updateDoc(userRef, { type: profileType, profileSetupData: newProfileSetupData });
}

export async function deleteUser(userId: string) {
    const db = getFirestoreDb();
    await deleteDoc(doc(db, 'users', userId));
}

export async function toggleUserPause(userId: string, currentIsPaused: boolean) {
    await updateUser(userId, { isPaused: !currentIsPaused });
}

export async function updateUserProfileImage(userId: string, imageUrl: string) {
    await updateUser(userId, { profileImage: imageUrl });
}

export async function toggleGps(userId: string, currentStatus: boolean) {
    await updateUser(userId, { isGpsActive: !currentStatus });
}

// --- Verification and Auth Actions ---

export async function sendPhoneVerification(userId: string, phone: string) {
    await sendSmsVerificationCodeFlow({ userId, phoneNumber: phone });
}

export async function verifyPhoneCode(userId: string, code: string): Promise<boolean> {
    const result = await verifySmsCodeFlow({ userId, code });
    return result.success;
}

export async function autoVerifyIdWithAI(user: User): Promise<VerificationOutput> {
    if (!user.name || !user.idNumber || !user.idDocumentUrl) {
      throw new Error("Faltan datos del usuario para la verificación.");
    }
    return autoVerifyIdWithAIFlow({
      userId: user.id,
      nameInRecord: `${user.name} ${user.lastName || ''}`,
      idInRecord: user.idNumber,
      documentImageUrl: user.idDocumentUrl,
      isCompany: user.profileSetupData?.providerType === 'company',
    });
}

export async function verifyUserId(userId: string) {
    await updateUser(userId, { idVerificationStatus: 'verified', verified: true });
}

export async function rejectUserId(userId: string) {
    await updateUser(userId, { idVerificationStatus: 'rejected', verified: false, idDocumentUrl: deleteField() as any });
}

// --- Publication and Product Actions ---

export async function createPublication(data: CreatePublicationInput) {
    await createPublicationFlow(data);
}

export async function createProduct(data: CreateProductInput): Promise<string> {
    const productId = await createProductFlow(data);
    if (!productId) throw new Error("Failed to create product");
    return productId;
}

export async function removeGalleryImage(userId: string, imageId: string) {
    const db = getFirestoreDb();
    await deleteDoc(doc(db, 'publications', imageId));
}

export async function updateGalleryImage(ownerId: string, imageId: string, updates: Partial<{ description: string; imageDataUri: string }>) {
    const db = getFirestoreDb();
    const pubRef = doc(db, 'publications', imageId);
    const updatesToApply: any = {};
    if (updates.description) {
        updatesToApply.description = updates.description;
        updatesToApply.alt = updates.description.slice(0, 50);
    }
    if (updates.imageDataUri) {
        updatesToApply.src = updates.imageDataUri;
    }
    await updateDoc(pubRef, updatesToApply);
}


// --- Transaction and Cart Actions ---

export async function updateCart(userId: string, newCart: CartItem[]) {
    const db = getFirestoreDb();
    const q = query(collection(db, 'transactions'), where('clientId', '==', userId), where('status', '==', 'Carrito Activo'));
    const snapshot = await getDocs(q);
    const cartTx = snapshot.docs.length > 0 ? snapshot.docs[0].data() as Transaction : null;

    if (newCart.length > 0) {
        if (cartTx) {
            const txRef = doc(db, 'transactions', cartTx.id);
            await updateDoc(txRef, { 'details.items': newCart.map(item => ({...item})) });
        } else {
            const newTxId = `txn-cart-${userId}-${Date.now()}`;
            const providerId = newCart[0].product.providerId;
            const newCartTx: Transaction = {
                id: newTxId, type: 'Compra', status: 'Carrito Activo', date: new Date().toISOString(), amount: 0,
                clientId: userId, providerId: providerId, participantIds: [userId, providerId], details: { items: newCart.map(item => ({...item})) }
            };
            await setDoc(doc(db, 'transactions', newTxId), newCartTx);
        }
    } else if (cartTx) {
        await deleteDoc(doc(db, 'transactions', cartTx.id));
    }
}

export async function checkout(userId: string, providerId: string, deliveryMethod: string, useCredicora: boolean, recipientInfo?: { name: string, phone: string }, deliveryAddress?: string) {
    const db = getFirestoreDb();
    const q = query(collection(db, 'transactions'), where('clientId', '==', userId), where('providerId', '==', providerId), where('status', '==', 'Carrito Activo'));
    const snapshot = await getDocs(q);
    const cartTx = snapshot.docs.length > 0 ? snapshot.docs[0].data() as Transaction : null;
    
    if (!cartTx) throw new Error("Cart not found for checkout");
    
    const deliveryDetails = {
        delivery: deliveryMethod !== 'pickup',
        deliveryMethod: deliveryMethod,
        pickupInStore: deliveryMethod === 'pickup',
        deliveryLocation: deliveryAddress,
        recipientInfo,
    };
    
    // Note: Delivery cost calculation would need to be done here on the server
    await updateDoc(doc(db, 'transactions', cartTx.id), { 
        status: 'Buscando Repartidor',
        'details.delivery': deliveryDetails,
        'details.deliveryCost': 0, // Placeholder
        'details.paymentMethod': useCredicora ? 'credicora' : 'direct',
    });

    if (deliveryMethod !== 'pickup') {
        await findDeliveryProviderFlow({ transactionId: cartTx.id });
    }
}

export const { payCommitment, sendQuote, acceptQuote, acceptAppointment, confirmPaymentReceived, completeWork, confirmWorkReceived, startDispute, createAppointmentRequest, processDirectPayment } = TransactionFlows;


// --- Messaging Actions ---

export async function sendMessage(options: SendMessageInput) {
    await sendMessageFlow(options);
}

export async function acceptProposal(conversationId: string, messageId: string, acceptorId: string) {
    await acceptProposalFlow({ conversationId, messageId, acceptorId });
}

export async function markConversationAsRead(conversationId: string, userId: string) {
    const db = getFirestoreDb();
    const convoRef = doc(db, 'conversations', conversationId);
    const convoSnap = await getDoc(convoRef);
    if (convoSnap.exists()) {
        const conversation = convoSnap.data() as Conversation;
        const updatedMessages = conversation.messages.map(msg => 
            msg.senderId !== userId ? { ...msg, isRead: true } : msg
        );
        await updateDoc(convoRef, { messages: updatedMessages });
    }
}

// --- Campaign and Promotion Actions ---

export async function createCampaign(userId: string, data: Omit<CreateCampaignInput, 'userId'>) {
    return await createCampaignFlow({ userId, ...data });
}

export async function activatePromotion(userId: string, details: { imageId: string, promotionText: string, cost: number }) {
    const db = getFirestoreDb();
    await updateDoc(doc(db, 'users', userId), {
        promotion: { text: details.promotionText, expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
    });
    const pubRef = doc(db, 'publications', details.imageId);
    await updateDoc(pubRef, { isTemporary: false, 'promotion.text': details.promotionText, 'promotion.expires': new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() });
}

// --- Admin Actions ---

export async function verifyCampaignPayment(transactionId: string, campaignId: string) {
    const db = getFirestoreDb();
    const batch = writeBatch(db);
    batch.update(doc(db, 'transactions', transactionId), { status: 'Resuelto' });
    if(campaignId) {
      batch.update(doc(db, 'campaigns', campaignId), { status: 'active' });
    }
    await batch.commit();
}


// --- Affiliation Actions ---
export const requestAffiliation = requestAffiliationFlow;
export const approveAffiliation = (affiliationId: string, actorId: string) => approveAffiliationFlow({ affiliationId, actorId });
export const rejectAffiliation = (affiliationId: string, actorId: string) => rejectAffiliationFlow({ affiliationId, actorId });
export const revokeAffiliation = (affiliationId: string, actorId: string) => revokeAffiliationFlow({ affiliationId, actorId });

// --- QR Session Actions ---
export async function startQrSession(clientId: string, providerId: string, cashierBoxId?: string, cashierName?: string) {
    const db = getFirestoreDb();
    const sessionId = `qrs-${clientId.slice(-5)}-${Date.now()}`;
    const sessionData: QrSession = {
      id: sessionId, providerId, clientId, cashierBoxId, cashierName, status: 'pendingAmount',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), participantIds: [clientId, providerId],
    };
    await setDoc(doc(db, 'qr_sessions', sessionId), sessionData);
    return sessionId;
}

export async function cancelQrSession(sessionId: string) {
    const db = getFirestoreDb();
    await updateDoc(doc(db, 'qr_sessions', sessionId), { status: 'cancelled' });
}

export async function setQrSessionAmount(sessionId: string, amount: number, initialPayment: number, financedAmount: number, installments: number) {
    const db = getFirestoreDb();
    await updateDoc(doc(db, 'qr_sessions', sessionId), { amount, initialPayment, financedAmount, installments, status: 'pendingClientApproval' });
}

export async function handleClientCopyAndPay(sessionId: string) {
    const db = getFirestoreDb();
    await updateDoc(doc(db, 'qr_sessions', sessionId), { status: 'awaitingPayment', updatedAt: new Date().toISOString() });
}

export async function confirmMobilePayment(sessionId: string) {
    await TransactionFlows.processDirectPayment({ sessionId });
    const db = getFirestoreDb();
    const sessionRef = doc(db, 'qr_sessions', sessionId);
    await updateDoc(sessionRef, { status: 'completed', updatedAt: new Date().toISOString() });
}

// --- Cashier Box Actions ---
export async function addCashierBox(userId: string, name: string, password: string): Promise<CashierBox> {
    const newBox = await createCashierBoxFlow({ userId, name, password });
    if (!newBox) throw new Error("Failed to create cashier box");
    const db = getFirestoreDb();
    await updateDoc(doc(db, 'users', userId), {
        'profileSetupData.cashierBoxes': arrayUnion(newBox)
    });
    return newBox;
}

export async function removeCashierBox(userId: string, boxId: string) {
    const db = getFirestoreDb();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const user = userSnap.data() as User;
    const boxToRemove = user.profileSetupData?.cashierBoxes?.find(b => b.id === boxId);
    if (boxToRemove) {
        await updateDoc(userRef, {
            'profileSetupData.cashierBoxes': arrayRemove(boxToRemove)
        });
    }
}

export async function updateCashierBox(userId: string, boxId: string, updates: Partial<Pick<CashierBox, 'name' | 'passwordHash'>>) {
    const db = getFirestoreDb();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const user = userSnap.data() as User;
    const boxes = user.profileSetupData?.cashierBoxes || [];
    const boxIndex = boxes.findIndex(b => b.id === boxId);
    if (boxIndex > -1) {
        const updatedBox = { ...boxes[boxIndex], ...updates };
        const newBoxes = [...boxes];
        newBoxes[boxIndex] = updatedBox;
        await updateDoc(userRef, { 'profileSetupData.cashierBoxes': newBoxes });
    }
}

export async function regenerateCashierBoxQr(userId: string, boxId: string) {
    const newQrData = await regenerateCashierQrFlow({ boxId, userId });
    const db = getFirestoreDb();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const user = userSnap.data() as User;
    const boxes = user.profileSetupData?.cashierBoxes || [];
    const boxIndex = boxes.findIndex(b => b.id === boxId);
    if (boxIndex > -1) {
        const updatedBox = { ...boxes[boxIndex], ...newQrData };
        const newBoxes = [...boxes];
        newBoxes[boxIndex] = updatedBox;
        await updateDoc(userRef, { 'profileSetupData.cashierBoxes': newBoxes });
    }
}

// --- Delivery Actions ---
export const retryFindDelivery = findDeliveryProviderFlow;
export const resolveDeliveryAsPickup = resolveDeliveryAsPickupFlow;
export async function assignOwnDelivery(transactionId: string, userId: string) {
    await updateDoc(doc(getFirestoreDb(), 'transactions', transactionId), {
        'details.deliveryProviderId': userId,
        status: 'En Reparto',
    });
}
