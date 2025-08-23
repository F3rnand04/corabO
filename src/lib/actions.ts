
'use server';
/**
 * @fileOverview Server Actions for the Corabo application.
 * This file serves as the PRIMARY and SOLE bridge between client-side components and server-side Genkit flows.
 * All functions exported from this file are marked as server actions and will only execute on the server.
 * Client components should ONLY import from this file to interact with the backend.
 */

import { getFirestore, doc, updateDoc, writeBatch, getDoc, FieldValue, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase-admin/firestore';
import { getOrCreateUserFlow, FirebaseUserInput } from '@/ai/flows/auth-flow';
import { createPublication as createPublicationFlow, createProduct as createProductFlow, addCommentToImage as addCommentToImageFlow, removeCommentFromImage as removeCommentFromImageFlow, updateGalleryImage as updateGalleryImageFlow, removeGalleryImage as removeGalleryImageFlow, type CreatePublicationInput, type CreateProductInput } from '@/ai/flows/publication-flow';
import { completeInitialSetupFlow, checkIdUniquenessFlow, getPublicProfileFlow, updateUserFlow, deleteUserFlow, getProfileGallery as getProfileGalleryFlow, getProfileProducts as getProfileProductsFlow } from '@/ai/flows/profile-flow';
import { sendMessage as sendMessageFlow, acceptProposal as acceptProposalFlow } from '@/ai/flows/message-flow';
import { autoVerifyIdWithAI as autoVerifyIdWithAIFlow } from '@/ai/flows/verification-flow';
import { getFeed as getFeedFlow } from '@/ai/flows/feed-flow';
import { createCampaign as createCampaignFlow, type CreateCampaignInput } from '@/ai/flows/campaign-flow';
import { sendNewCampaignNotifications as sendNewCampaignNotificationsFlow, sendWelcomeToProviderNotification } from '@/ai/flows/notification-flow';
import { checkout as checkoutFlow, completeWork as completeWorkFlow, confirmPaymentReceived as confirmPaymentReceivedFlow, confirmWorkReceived as confirmWorkReceivedFlow, createAppointmentRequest as createAppointmentRequestFlow, findDeliveryProvider, payCommitment as payCommitmentFlow, resolveDeliveryAsPickup as resolveDeliveryAsPickupFlow, sendQuote as sendQuoteFlow, startDispute as startDisputeFlow, acceptQuote as acceptQuoteFlow, acceptAppointment as acceptAppointmentFlow, cancelSystemTransaction as cancelSystemTransactionFlow, downloadTransactionsPDF as downloadTransactionsPDFFlow, processDirectPayment } from '@/ai/flows/transaction-flow';
import { createCashierBox as createCashierBoxFlow, regenerateCashierQr as regenerateCashierQrFlow, requestCashierSession as requestCashierSessionFlow } from '@/ai/flows/cashier-flow';
import { approveAffiliation as approveAffiliationFlow, rejectAffiliation as rejectAffiliationFlow, requestAffiliation as requestAffiliationFlow, revokeAffiliation as revokeAffiliationFlow } from '@/ai/flows/affiliation-flow';
import type { User, ProfileSetupData, Transaction, QrSession, CashierBox, AppointmentRequest } from './types';


// =================================
// AUTH FLOWS
// =================================
export async function getOrCreateUser(firebaseUser: FirebaseUserInput) {
  return await getOrCreateUserFlow(firebaseUser);
}

// =================================
// USER PROFILE & SETUP FLOWS
// =================================
export async function updateUser(userId: string, updates: Partial<User>) {
  return await updateUserFlow({ userId, updates });
}

export async function deleteUser(userId: string) {
    return await deleteUserFlow({ userId });
}

export async function checkIdUniqueness(idNumber: string, country: string, currentUserId: string) {
    return await checkIdUniquenessFlow({ idNumber, country, currentUserId });
}

export async function completeInitialSetup(data: any) {
    return await completeInitialSetupFlow(data);
}

export async function getPublicProfile(userId: string) {
    return await getPublicProfileFlow({ userId });
}

export async function getProfileGallery(options: { userId: string, limitNum?: number, startAfterDocId?: string }) {
    return await getProfileGalleryFlow(options);
}

export async function getProfileProducts(options: { userId: string, limitNum?: number, startAfterDocId?: string }) {
    return await getProfileProductsFlow(options);
}

export async function updateFullProfile(userId: string, formData: ProfileSetupData, userType: string) {
  const updates = {
    profileSetupData: formData,
    type: userType,
  };
  await updateUserFlow({ userId, updates });
  if (userType === 'provider') {
    await sendWelcomeToProviderNotification({ userId });
  }
}

export async function autoVerifyIdWithAI(user: User) {
    return await autoVerifyIdWithAIFlow({
        userId: user.id,
        nameInRecord: `${user.name} ${user.lastName || ''}`.trim(),
        idInRecord: user.idNumber || '',
        documentImageUrl: user.idDocumentUrl!,
        isCompany: user.profileSetupData?.providerType === 'company',
    });
}

export async function verifyUserId(userId: string) {
    await updateUserFlow({ userId, updates: { idVerificationStatus: 'verified', verified: true } });
}

export async function rejectUserId(userId: string) {
    await updateUserFlow({ userId, updates: { idVerificationStatus: 'rejected' } });
}

export async function updateUserProfileImage(userId: string, dataUrl: string) {
  await updateUserFlow({ userId, updates: { profileImage: dataUrl } });
}

// =================================
// PUBLICATION & PRODUCT FLOWS
// =================================
export async function createPublication(data: CreatePublicationInput) {
    return await createPublicationFlow(data);
}

export async function createProduct(data: CreateProductInput) {
    return await createProductFlow(data);
}

export async function addCommentToImage(data: { ownerId: string, imageId: string, commentText: string, author: { id: string, name: string, profileImage: string }}) {
    return await addCommentToImageFlow(data);
}

export async function removeCommentFromImage(data: { ownerId: string, imageId: string, commentIndex: number }) {
    return await removeCommentFromImageFlow(data);
}

export async function updateGalleryImage(data: { ownerId: string, imageId: string, updates: { description?: string, imageDataUri?: string }}) {
    return await updateGalleryImageFlow(data);
}

export async function removeGalleryImage(ownerId: string, imageId: string) {
    return await removeGalleryImageFlow({ ownerId, imageId });
}

// =================================
// FEED FLOWS
// =================================
export async function getFeed(options: { limitNum?: number; startAfterDocId?: string; }) {
    return await getFeedFlow(options);
}

// =================================
// MESSAGING FLOWS
// =================================
export async function sendMessage(data: { conversationId: string, senderId: string, recipientId: string, text?: string, location?: { lat: number, lon: number }, proposal?: any }) {
    return await sendMessageFlow(data);
}

export async function acceptProposal(data: { conversationId: string, messageId: string, acceptorId: string }) {
    return await acceptProposalFlow(data);
}

// =================================
// CAMPAIGN FLOWS
// =================================
export async function createCampaign(userId: string, input: Omit<CreateCampaignInput, 'userId'>) {
    return await createCampaignFlow({ userId, ...input });
}

export async function sendNewCampaignNotifications(data: { campaignId: string }) {
    return await sendNewCampaignNotificationsFlow(data);
}

export async function verifyCampaignPayment(transactionId: string, campaignId: string) {
    const db = getFirestore();
    const batch = writeBatch(db);
    const txRef = doc(db, 'transactions', transactionId);
    batch.update(txRef, { status: 'Pagado' });

    if(campaignId) {
        const campaignRef = doc(db, 'campaigns', campaignId);
        batch.update(campaignRef, { status: 'active' });
    }
    
    await batch.commit();
}

// =================================
// TRANSACTION & CHECKOUT FLOWS
// =================================

export async function startDispute(transactionId: string) {
    return await startDisputeFlow(transactionId);
}

export async function cancelSystemTransaction(transactionId: string) {
    return await cancelSystemTransactionFlow(transactionId);
}

export async function downloadTransactionsPDF(transactions: Transaction[]) {
    return await downloadTransactionsPDFFlow(transactions);
}

export async function checkout(userId: string, providerId: string, deliveryMethod: string, useCredicora: boolean, recipientInfo?: any, deliveryAddress?: string) {
    return await checkoutFlow({ userId, providerId, deliveryMethod, useCredicora, recipientInfo, deliveryAddress });
}

export async function retryFindDelivery(data: { transactionId: string }) {
    return await findDeliveryProvider(data);
}

export async function resolveDeliveryAsPickup(data: { transactionId: string }) {
    return await resolveDeliveryAsPickupFlow(data);
}

export async function sendQuote(data: { transactionId: string; userId: string; breakdown: string; total: number; }) {
    return await sendQuoteFlow(data);
}

export async function payCommitment(data: { transactionId: string; userId: string; paymentDetails: { paymentMethod: string; paymentReference?: string; paymentVoucherUrl?: string; }; }) {
    return await payCommitmentFlow(data);
}

export async function confirmPaymentReceived(data: { transactionId: string; userId: string; fromThirdParty: boolean; }) {
    return await confirmPaymentReceivedFlow(data);
}

export async function completeWork(data: { transactionId: string; userId: string; }) {
    return await completeWorkFlow(data);
}

export async function confirmWorkReceived(data: { transactionId: string; userId: string; rating: number; comment?: string; }) {
    return await confirmWorkReceivedFlow(data);
}

export async function acceptQuote(data: { transactionId: string; userId: string; }) {
    return await acceptQuoteFlow(data);
}

export async function createAppointmentRequest(data: Omit<AppointmentRequest, 'clientId'>) {
    return await createAppointmentRequestFlow(data);
}

export async function acceptAppointment(data: { transactionId: string; userId: string; }) {
    return await acceptAppointmentFlow(data);
}

// =================================
// AFFILIATION FLOWS
// =================================
export async function approveAffiliation(affiliationId: string, actorId: string) {
    return await approveAffiliationFlow({ affiliationId, actorId });
}

export async function rejectAffiliation(affiliationId: string, actorId: string) {
    return await rejectAffiliationFlow({ affiliationId, actorId });
}

export async function requestAffiliation(providerId: string, companyId: string) {
    return await requestAffiliationFlow({ providerId, companyId });
}

export async function revokeAffiliation(affiliationId: string, actorId: string) {
    return await revokeAffiliationFlow({ affiliationId, actorId });
}


// =================================
// CASHIER & QR FLOWS
// =================================
export async function createCashierBox(userId: string, name: string, password: string): Promise<void> {
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    const newBox = await createCashierBoxFlow({ userId, name, password });
    
    await updateDoc(userRef, {
        'profileSetupData.cashierBoxes': FieldValue.arrayUnion(newBox)
    });
}

export async function removeCashierBox(userId: string, boxId: string): Promise<void> {
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if(userSnap.exists()){
        const existingBoxes = userSnap.data().profileSetupData?.cashierBoxes || [];
        const updatedBoxes = existingBoxes.filter((box: CashierBox) => box.id !== boxId);
        await updateDoc(userRef, {
            'profileSetupData.cashierBoxes': updatedBoxes
        });
    }
}

export async function updateCashierBox(userId: string, boxId: string, updates: Partial<CashierBox>): Promise<void> {
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if(userSnap.exists()){
        const existingBoxes = userSnap.data().profileSetupData?.cashierBoxes || [];
        const updatedBoxes = existingBoxes.map((box: CashierBox) => 
            box.id === boxId ? { ...box, ...updates } : box
        );
         await updateDoc(userRef, {
            'profileSetupData.cashierBoxes': updatedBoxes
        });
    }
}


export async function regenerateCashierBoxQr(userId: string, boxId: string): Promise<void> {
    const newQrData = await regenerateCashierQrFlow({ userId, boxId });

    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if(userSnap.exists()){
        const existingBoxes = userSnap.data().profileSetupData?.cashierBoxes || [];
        const updatedBoxes = existingBoxes.map((box: CashierBox) => 
            box.id === boxId ? { ...box, qrValue: newQrData.qrValue, qrDataURL: newQrData.qrDataURL } : box
        );
        await updateDoc(userRef, { 'profileSetupData.cashierBoxes': updatedBoxes });
    }
}

export async function requestCashierSession(data: { businessCoraboId: string, cashierName: string, cashierBoxId: string, password: string}) {
    return await requestCashierSessionFlow(data);
}


export async function startQrSession(clientId: string, providerId: string, cashierBoxId?: string) {
    const db = getFirestore();
    const sessionId = `qr-${Date.now()}`;
    const sessionRef = doc(db, 'qr_sessions', sessionId);
    const sessionData: QrSession = {
        id: sessionId,
        providerId,
        clientId,
        cashierBoxId,
        status: 'pendingAmount',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        participantIds: [clientId, providerId],
    };
    await sessionRef.set(sessionData);
    return sessionId;
}

export async function setQrSessionAmount(sessionId: string, amount: number, initialPayment: number, financedAmount: number, installments: number) {
    const db = getFirestore();
    await updateDoc(doc(db, 'qr_sessions', sessionId), {
        amount,
        initialPayment,
        financedAmount,
        installments,
        status: 'pendingClientApproval',
        updatedAt: new Date().toISOString(),
    });
}
export async function handleClientCopyAndPay(sessionId: string) {
    const db = getFirestore();
    await updateDoc(doc(db, 'qr_sessions', sessionId), {
        status: 'awaitingPayment',
        updatedAt: new Date().toISOString(),
    });
}

export async function confirmMobilePayment(sessionId: string) {
    const db = getFirestore();
    await updateDoc(doc(db, 'qr_sessions', sessionId), {
        status: 'pendingVoucherUpload',
        updatedAt: new Date().toISOString(),
    });
}

export async function finalizeQrSession(sessionId: string) {
    return processDirectPayment({sessionId});
}

export async function cancelQrSession(sessionId: string) {
    const db = getFirestore();
    await updateDoc(doc(db, 'qr_sessions', sessionId), {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
    });
}


export async function registerSystemPayment(userId: string, concept: string, amount: number, isSubscription: boolean) {
    const db = getFirestore();
    const txId = `txn-sys-${Date.now()}`;
    const transaction: Transaction = {
        id: txId,
        type: 'Sistema',
        status: 'Pago Enviado - Esperando Confirmación',
        date: new Date().toISOString(),
        amount: amount,
        clientId: userId,
        providerId: 'corabo-admin',
        participantIds: [userId, 'corabo-admin'],
        details: {
            system: concept,
            isSubscription: isSubscription,
        }
    };
    await writeBatch(db).set(doc(db, 'transactions', txId), transaction).commit();
}


export async function subscribeUser(userId: string, planName: string, amount: number) {
    const db = getFirestore();
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, { isSubscribed: true });

    const txId = `txn-sub-${Date.now()}`;
    const subscriptionTx: Transaction = {
        id: txId,
        type: 'Sistema',
        status: 'Pago Enviado - Esperando Confirmación',
        date: new Date().toISOString(),
        amount: amount,
        clientId: userId,
        providerId: 'corabo-admin',
        participantIds: [userId, 'corabo-admin'],
        details: {
            system: `Suscripción a ${planName}`,
            isSubscription: true,
            isRenewable: true,
        }
    };
    batch.set(doc(db, 'transactions', txId), subscriptionTx);

    await batch.commit();
}


export async function toggleGps(userId: string) {
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if(userSnap.exists()){
        await updateDoc(userRef, { isGpsActive: !userSnap.data().isGpsActive });
    }
}

export async function toggleUserPause(userId: string, isPaused: boolean) {
    await updateUserFlow({ userId, updates: { isPaused } });
}

export async function deactivateTransactions(userId: string) {
    await updateUserFlow({ userId, updates: { isTransactionsActive: false } });
}

export async function activateTransactions(userId: string, paymentDetails: any) {
    await updateUserFlow({ userId, updates: {
      isTransactionsActive: true,
      'profileSetupData.paymentDetails': paymentDetails
    }});
}


export async function updateCart(userId: string, productId: string, newQuantity: number) {
    const db = getFirestore();
    
    const q = query(collection(db, 'transactions'), where('clientId', '==', userId), where('status', '==', 'Carrito Activo'));
    const snapshot = await getDocs(q);
    
    let cartRef;
    let cartData: Partial<Transaction> = {};

    if (snapshot.empty) {
        const newCartId = `txn-cart-${userId}-${Date.now()}`;
        cartRef = doc(db, 'transactions', newCartId);
        cartData = {
            id: newCartId,
            clientId: userId,
            status: 'Carrito Activo',
            type: 'Compra',
            date: new Date().toISOString(),
            participantIds: [userId],
            amount: 0,
            details: { items: [] }
        };
    } else {
        cartRef = snapshot.docs[0].ref;
        cartData = snapshot.docs[0].data();
    }

    const items = cartData.details?.items || [];
    const itemIndex = items.findIndex((item: any) => item.product.id === productId);

    if (newQuantity > 0) {
        if (itemIndex > -1) {
            items[itemIndex].quantity = newQuantity;
        } else {
            const productDoc = await getDoc(doc(db, 'publications', productId));
            if(productDoc.exists()){
                const productData = productDoc.data();
                const productForCart = {
                    id: productId,
                    name: productData.productDetails?.name || 'Producto sin nombre',
                    price: productData.productDetails?.price || 0,
                    imageUrl: productData.src,
                    providerId: productData.providerId,
                };
                items.push({ product: productForCart, quantity: newQuantity });
            }
        }
    } else {
        if (itemIndex > -1) {
            items.splice(itemIndex, 1);
        }
    }
    
    let totalAmount = 0;
    const providerIds = new Set<string>([userId]);
    items.forEach((item: any) => {
        totalAmount += item.product.price * item.quantity;
        providerIds.add(item.product.providerId);
    });

    const updatedCartData = {
        ...cartData,
        amount: totalAmount,
        participantIds: Array.from(providerIds),
        providerId: items.length > 0 ? items[0].product.providerId : '',
        details: { ...cartData.details, items: items }
    };
    
    await setDoc(cartRef, updatedCartData, { merge: true });
}


export async function assignOwnDelivery(transactionId: string, providerId: string) {
    const db = getFirestore();
    const txRef = doc(db, 'transactions', transactionId);

    await updateDoc(txRef, {
        'details.deliveryProviderId': providerId,
        'details.delivery.method': 'delivery-own',
        status: 'En Reparto',
    });
}
