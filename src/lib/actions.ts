
'use server';
/**
 * @fileOverview Server Actions for the Corabo application.
 * This file serves as the primary bridge between client-side components and server-side Genkit flows.
 * All functions exported from this file are marked as server actions and will only execute on the server.
 */

// FLOW IMPORTS
import {
  getOrCreateUserFlow,
  completeInitialSetupFlow,
  checkIdUniquenessFlow,
  updateUserFlow,
  deleteUserFlow,
  getPublicProfileFlow,
  getProfileGallery as getProfileGalleryFlow,
  getProfileProducts as getProfileProductsFlow,
} from '@/ai/flows/profile-flow';
import {
    createPublication as createPublicationFlow,
    createProduct as createProductFlow,
    addCommentToImage as addCommentToImageFlow,
    removeCommentFromImage as removeCommentFromImageFlow,
    updateGalleryImage as updateGalleryImageFlow,
    removeGalleryImage as removeGalleryImageFlow,
} from '@/ai/flows/publication-flow';
import {
    sendMessage as sendMessageFlow,
    acceptProposal as acceptProposalFlow
} from '@/ai/flows/message-flow';
import {
    createCampaign as createCampaignFlow
} from '@/ai/flows/campaign-flow';
import {
    autoVerifyIdWithAI as autoVerifyIdWithAIFlow
} from '@/ai/flows/verification-flow';
import {
    processDirectPayment as processDirectPaymentFlow,
    completeWork as completeWorkFlow,
    confirmWorkReceived as confirmWorkReceivedFlow,
    payCommitment as payCommitmentFlow,
    confirmPaymentReceived as confirmPaymentReceivedFlow,
    sendQuote as sendQuoteFlow,
    acceptQuote as acceptQuoteFlow,
    createAppointmentRequest as createAppointmentRequestFlow,
    acceptAppointment as acceptAppointmentFlow,
    startDispute as startDisputeFlow,
    cancelSystemTransaction as cancelSystemTransactionFlow,
    downloadTransactionsPDF as downloadTransactionsPDFFlow,
    checkout as checkoutFlow,
} from '@/ai/flows/transaction-flow';
import {
    findDeliveryProvider as findDeliveryProviderFlow,
    resolveDeliveryAsPickup as resolveDeliveryAsPickupFlow
} from '@/ai/flows/delivery-flow';
import {
    sendNewCampaignNotifications as sendNewCampaignNotificationsFlow,
    sendWelcomeToProviderNotification as sendWelcomeToProviderNotificationFlow
} from '@/ai/flows/notification-flow';
import {
  createCashierBox as createCashierBoxFlow,
  regenerateCashierQr as regenerateCashierQrFlow,
  requestCashierSession as requestCashierSessionFlow,
} from '@/ai/flows/cashier-flow';
import { getFeed as getFeedFlow } from '@/ai/flows/feed-flow';

// TYPE IMPORTS
import type { User, GalleryImage, Product, Transaction, AppointmentRequest, Affiliation, SpecializedData, ProfileSetupData, CreatePublicationInput, CreateProductInput, QrSession, TempRecipientInfo, CashierBox } from '@/lib/types';
import { getFirestore, writeBatch, doc, updateDoc, arrayUnion, arrayRemove, increment, deleteDoc, setDoc, getDoc, collection, where, query, getDocs } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from './firebase-server';
import { revalidatePath } from 'next/cache';

const db = getFirebaseAdmin().firestore;

// ACTION WRAPPERS

// Profile Flows
export async function getOrCreateUser(firebaseUser: any) {
    return getOrCreateUserFlow(firebaseUser);
}
export async function completeInitialSetup(data: any) {
    return completeInitialSetupFlow(data);
}
export async function checkIdUniqueness(data: any) {
    return checkIdUniquenessFlow(data);
}
export async function getProfileGallery(data: any) {
    return getProfileGalleryFlow(data);
}
export async function getProfileProducts(data: any) {
    return getProfileProductsFlow(data);
}
export async function getPublicProfile(data: any) {
    return getPublicProfileFlow(data);
}
export async function deleteUser(userId: string) {
    await deleteUserFlow({ userId });
    revalidatePath('/', 'layout');
}
export async function updateUser(userId: string, updates: Partial<User>) {
    await updateUserFlow({ userId, updates });
    revalidatePath('/', 'layout');
}

// Feed Flow
export async function getFeed(data: any) {
    return getFeedFlow(data);
}

// Campaign Flow
export async function createCampaign(userId: string, campaignData: any) {
    const input = { userId, ...campaignData };
    await createCampaignFlow(input);
    revalidatePath('/transactions');
}

// Message Flow
export async function sendMessage(options: any) {
    await sendMessageFlow(options);
    revalidatePath('/messages');
}
export async function acceptProposal(conversationId: string, messageId: string, acceptorId: string) {
    await acceptProposalFlow({ conversationId, messageId, acceptorId });
    revalidatePath('/messages');
}

// Verification Flow
export async function autoVerifyIdWithAI(user: User) {
    if (!user.idDocumentUrl || !user.name || !user.idNumber) {
        throw new Error("Missing required user data for verification.");
    }
    return autoVerifyIdWithAIFlow({
        userId: user.id,
        nameInRecord: `${user.name} ${user.lastName || ''}`.trim(),
        idInRecord: user.idNumber,
        documentImageUrl: user.idDocumentUrl,
        isCompany: user.profileSetupData?.providerType === 'company',
    });
}

// Publication Flow
export async function createPublication(data: CreatePublicationInput) {
    await createPublicationFlow(data);
    revalidatePath('/profile/publications');
}
export async function createProduct(data: CreateProductInput) {
    await createProductFlow(data);
    revalidatePath('/profile/catalog');
}
export async function addCommentToImage(data: any) {
    await addCommentToImageFlow(data);
    revalidatePath('/publications'); // Revalidate a general path
}
export async function removeCommentFromImage(data: any) {
    await removeCommentFromImageFlow(data);
    revalidatePath('/publications');
}
export async function updateGalleryImage(data: any) {
    await updateGalleryImageFlow(data);
    revalidatePath('/publications');
}
export async function removeGalleryImage(ownerId: string, imageId: string) {
    await removeGalleryImageFlow({ ownerId, imageId });
    revalidatePath('/profile', 'layout');
}


// Transaction Flow
export async function sendQuote(data: any) {
    await sendQuoteFlow(data);
    revalidatePath('/transactions');
}
export async function payCommitment(transactionId: string) {
  const txRef = doc(db, 'transactions', transactionId);
  const txSnap = await getDoc(txRef);
  if (!txSnap.exists()) throw new Error("Transaction not found.");
  const tx = txSnap.data() as Transaction;
  
  await payCommitmentFlow({
      transactionId: tx.id,
      userId: tx.clientId,
      paymentDetails: { // Placeholder, client should provide this
          paymentMethod: 'Transferencia',
          paymentVoucherUrl: 'https://i.postimg.cc/L8y2zWc2/vzla-id.png'
      }
  });
  revalidatePath('/transactions');
}
export async function confirmPaymentReceived(data: any) {
    await confirmPaymentReceivedFlow(data);
    revalidatePath('/transactions');
}
export async function completeWork(data: any) {
    await completeWorkFlow(data);
    revalidatePath('/transactions');
}
export async function confirmWorkReceived(data: any) {
    await confirmWorkReceivedFlow(data);
    revalidatePath('/transactions');
}
export async function acceptQuote(data: any) {
    await acceptQuoteFlow(data);
    revalidatePath('/transactions');
}
export async function createAppointmentRequest(data: any) {
    await createAppointmentRequestFlow(data);
    revalidatePath('/transactions');
}
export async function acceptAppointment(data: any) {
    await acceptAppointmentFlow(data);
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
export async function downloadTransactionsPDF(data: any) {
    return downloadTransactionsPDFFlow(data);
}
export async function checkout(userId: string, providerId: string, deliveryMethod: string, useCredicora: boolean, recipientInfo?: TempRecipientInfo, deliveryAddress?: string) {
    await checkoutFlow({ userId, providerId, deliveryMethod, useCredicora, recipientInfo, deliveryAddress });
    revalidatePath('/transactions');
}


// Delivery Flow
export async function retryFindDelivery(data: { transactionId: string }) {
    await findDeliveryProviderFlow(data);
    revalidatePath('/transactions');
}
export async function assignOwnDelivery(transactionId: string, providerId: string) {
    const txRef = doc(db, 'transactions', transactionId);
    await updateDoc(txRef, { 'details.deliveryProviderId': providerId, status: 'En Reparto' });
    revalidatePath('/transactions');
}
export async function resolveDeliveryAsPickup(data: { transactionId: string }) {
    await resolveDeliveryAsPickupFlow(data);
    revalidatePath('/transactions');
}

// Notification Flow
export async function sendNewCampaignNotifications(data: { campaignId: string }) {
    await sendNewCampaignNotificationsFlow(data);
}
export async function sendWelcomeToProviderNotification(data: { userId: string }) {
    await sendWelcomeToProviderNotificationFlow(data);
}

// Cashier Flow
export async function addCashierBox(userId: string, name: string, password: string) {
    const userRef = doc(db, 'users', userId);
    const box = await createCashierBoxFlow({ userId, name, password });
    await updateDoc(userRef, { 'profileSetupData.cashierBoxes': arrayUnion(box) });
    revalidatePath('/transactions/settings/cashier');
}
export async function updateCashierBox(userId: string, boxId: string, updates: Partial<CashierBox>) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data() as User;
    const boxes = userData.profileSetupData?.cashierBoxes || [];
    const boxIndex = boxes.findIndex(b => b.id === boxId);
    if (boxIndex === -1) return;
    boxes[boxIndex] = { ...boxes[boxIndex], ...updates };
    await updateDoc(userRef, { 'profileSetupData.cashierBoxes': boxes });
    revalidatePath('/transactions/settings/cashier');
}
export async function removeCashierBox(userId: string, boxId: string) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data() as User;
    const boxes = userData.profileSetupData?.cashierBoxes || [];
    const boxToRemove = boxes.find(b => b.id === boxId);
    if (boxToRemove) {
      await updateDoc(userRef, { 'profileSetupData.cashierBoxes': arrayRemove(boxToRemove) });
    }
    revalidatePath('/transactions/settings/cashier');
}
export async function regenerateCashierBoxQr(userId: string, boxId: string) {
    const { qrValue, qrDataURL } = await regenerateCashierQrFlow({ userId, boxId });
    await updateCashierBox(userId, boxId, { qrValue, qrDataURL });
    revalidatePath('/transactions/settings/cashier');
}
export async function requestCashierSession(data: any) {
    return requestCashierSessionFlow(data);
}


// Custom/Combined Actions
export async function updateUserProfileAndGallery(userId: string, newTempImage: GalleryImage) {
  const userRef = doc(db, 'users', userId);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await updateDoc(userRef, { 
    'profileSetupData.gallery': arrayUnion(newTempImage),
    'promotion.text': "Nueva Oferta",
    'promotion.expires': expires
  });
  revalidatePath('/profile');
}
export async function activatePromotion(userId: string, promotion: { imageId: string; promotionText: string; cost: number; }) {
    console.log(`Activating promotion for user ${userId}`, promotion);
    revalidatePath('/profile');
}
export async function updateFullProfile(userId: string, formData: ProfileSetupData, userType: User['type']) {
    const dataToUpdate: Partial<User> = { profileSetupData: formData, type: userType };
    if (formData.username && formData.specialty) {
        dataToUpdate.isInitialSetupComplete = true;
    }
    await updateUserFlow({ userId, updates: dataToUpdate });
    revalidatePath('/profile', 'layout');
}
export async function updateUserProfileImage(userId: string, dataUrl: string) {
    await updateUserFlow({ userId, updates: { profileImage: dataUrl } });
    revalidatePath('/profile');
}
export async function verifyUserId(userId: string) {
    await updateUserFlow({ userId, updates: { idVerificationStatus: 'verified', verified: true } });
    revalidatePath('/admin');
}
export async function rejectUserId(userId: string) {
    await updateUserFlow({ userId, updates: { idVerificationStatus: 'rejected', verified: false } });
    revalidatePath('/admin');
}
export async function toggleUserPause(userId: string, shouldBeActive: boolean) {
    await updateUserFlow({ userId, updates: { isPaused: !shouldBeActive } });
    revalidatePath('/admin');
}
export async function verifyCampaignPayment(transactionId: string, campaignId: string) {
    const batch = writeBatch(db);
    batch.update(doc(db, 'transactions', transactionId), { status: 'Pagado' });
    if (campaignId) {
        batch.update(doc(db, 'campaigns', campaignId), { status: 'active' });
    }
    await batch.commit();
    revalidatePath('/admin');
    revalidatePath('/transactions');
}

export async function updateCart(userId: string, productId: string, quantity: number) {
    // ... logic from old actions file
    const txCollection = collection(db, 'transactions');
    const q = query(txCollection, where('clientId', '==', userId), where('status', '==', 'Carrito Activo'));
    const snapshot = await getDocs(q);

    const productSnap = await getDoc(doc(db, 'publications', productId));
    if (!productSnap.exists()) throw new Error("Product not found");
    const productData = productSnap.data() as GalleryImage;
    const product: Product = {
         id: productData.id,
         name: productData.productDetails?.name || 'Producto sin nombre',
         description: productData.description,
         price: productData.productDetails?.price || 0,
         category: productData.productDetails?.category || 'General',
         providerId: productData.providerId,
         imageUrl: productData.src,
    };

    if (snapshot.empty) {
        if (quantity > 0) {
            const newCartId = `cart-${userId}-${Date.now()}`;
            const newCart: Transaction = {
                id: newCartId,
                type: 'Compra', status: 'Carrito Activo', date: new Date().toISOString(),
                amount: product.price * quantity,
                clientId: userId, providerId: product.providerId,
                participantIds: [userId, product.providerId],
                details: { items: [{ product, quantity }] }
            };
            await setDoc(doc(db, 'transactions', newCartId), newCart);
        }
    } else {
        const cartDoc = snapshot.docs[0];
        const cartData = cartDoc.data() as Transaction;
        const items = cartData.details.items || [];
        const itemIndex = items.findIndex(item => item.product.id === productId);

        if (itemIndex > -1) {
            if (quantity > 0) items[itemIndex].quantity = quantity;
            else items.splice(itemIndex, 1);
        } else if (quantity > 0) {
            items.push({ product, quantity });
        }
        
        if (items.length === 0) {
            await deleteDoc(cartDoc.ref);
        } else {
            const newTotalAmount = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
            await updateDoc(cartDoc.ref, { 'details.items': items, amount: newTotalAmount });
        }
    }
     revalidatePath('/', 'layout');
}

export async function startQrSession(clientId: string, providerId: string, cashierBoxId?: string) {
    const sessionId = `qrs-${clientId.slice(0, 5)}-${Date.now()}`;
    const newSession: QrSession = {
        id: sessionId, clientId, providerId, cashierBoxId,
        status: 'pendingAmount',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        participantIds: [clientId, providerId]
    };
    await setDoc(doc(db, 'qr_sessions', sessionId), newSession);
    return sessionId;
}
export async function setQrSessionAmount(sessionId: string, amount: number, initialPayment: number, financedAmount: number, installments: number) {
    await updateDoc(doc(db, 'qr_sessions', sessionId), { 
      status: 'pendingClientApproval', amount, initialPayment, financedAmount, installments,
      updatedAt: new Date().toISOString(),
    });
}
export async function handleClientCopyAndPay(sessionId: string) {
    await updateDoc(doc(db, 'qr_sessions', sessionId), { status: 'awaitingPayment', updatedAt: new Date().toISOString() });
}
export async function confirmMobilePayment(sessionId: string) {
    await updateDoc(doc(db, 'qr_sessions', sessionId), { status: 'pendingVoucherUpload', updatedAt: new Date().toISOString() });
}
export async function finalizeQrSession(sessionId: string) {
    await processDirectPaymentFlow({ sessionId });
    revalidatePath('/transactions');
}
export async function cancelQrSession(sessionId: string) {
    await updateDoc(doc(db, 'qr_sessions', sessionId), { status: 'cancelled', updatedAt: new Date().toISOString() });
}
export async function approveAffiliation(affiliationId: string, actorId: string) {
    const { sendNotification } = await import('@/ai/flows/notification-flow');
    const { approveAffiliationFlow } = await import('@/ai/flows/affiliation-flow');
    await approveAffiliationFlow({ affiliationId, actorId });
    const affiliationDoc = await getDoc(doc(db, 'affiliations', affiliationId));
    const affiliationData = affiliationDoc.data() as Affiliation;
    const companyData = await getDoc(doc(db, 'users', actorId));
    await sendNotification({
        userId: affiliationData.providerId,
        type: 'affiliation_request',
        title: '¡Solicitud Aprobada!',
        message: `${companyData.data()?.name} ha aprobado tu solicitud de asociación.`,
        link: `/companies/${actorId}`
    });
    revalidatePath('/admin');
}
export async function rejectAffiliation(affiliationId: string, actorId: string) {
    const { rejectAffiliationFlow } = await import('@/ai/flows/affiliation-flow');
    await rejectAffiliationFlow({ affiliationId, actorId });
    revalidatePath('/admin');
}
export async function revokeAffiliation(affiliationId: string, actorId: string) {
    const { revokeAffiliationFlow } = await import('@/ai/flows/affiliation-flow');
    await revokeAffiliationFlow({ affiliationId, actorId });
    revalidatePath('/admin');
}
export async function subscribeUser(userId: string, planName: string, amount: number) {
    const txId = `sub-${userId}-${Date.now()}`;
    const newTx: Transaction = {
        id: txId,
        type: 'Sistema',
        status: 'Pago Enviado - Esperando Confirmación',
        date: new Date().toISOString(),
        amount: amount,
        clientId: userId,
        providerId: 'corabo-admin',
        participantIds: [userId, 'corabo-admin'],
        details: {
            system: `Pago de suscripción: ${planName}`,
            isSubscription: true,
        },
    };
    await setDoc(doc(db, 'transactions', txId), newTx);
    revalidatePath('/transactions');
}
export async function registerSystemPayment(userId: string, concept: string, amount: number, isSubscription: boolean) {
    const txId = `sys-${userId}-${Date.now()}`;
    const newTx: Transaction = {
        id: txId,
        type: 'Sistema',
        status: 'Pago Enviado - Esperando Confirmación',
        date: new Date().toISOString(),
        amount,
        clientId: userId,
        providerId: 'corabo-admin',
        participantIds: [userId, 'corabo-admin'],
        details: {
            system: concept,
            isSubscription: isSubscription,
        }
    };
    await setDoc(doc(db, 'transactions', txId), newTx);
    revalidatePath('/transactions');
}
