
'use server';
/**
 * @fileOverview Service Layer for Client-to-Backend Actions
 * This file centralizes all calls to Genkit flows, abstracting the
 * business logic from the UI components. This is the ONLY place where
 * component-facing server actions should be defined.
 */

import { doc, updateDoc, deleteField, setDoc, getDoc, writeBatch, collection, where, query, getDocs, arrayRemove, arrayUnion, deleteDoc as deleteFirestoreDoc } from 'firebase/firestore';

// Types
import type { User, Product, CartItem, Transaction, GalleryImage, ProfileSetupData, Conversation, Message, AgreementProposal, VerificationOutput, AppointmentRequest, QrSession, TempRecipientInfo, CashierBox, GalleryImageComment, CreatePublicationInput, CreateProductInput } from '@/lib/types';
import { type CreateCampaignInput } from '@/ai/flows/campaign-flow';
import { type SendMessageInput } from '@/ai/flows/message-flow';


// Flows
import * as CampaignFlows from '@/ai/flows/campaign-flow';
import * as MessageFlows from '@/ai/flows/message-flow';
import * as TransactionFlows from '@/ai/flows/transaction-flow';
import * as NotificationFlows from '@/ai/flows/notification-flow';
import * as ProfileFlows from '@/ai/flows/profile-flow';
import * as VerificationFlows from '@/ai/flows/verification-flow';
import * as PublicationFlows from '@/ai/flows/publication-flow';
import * as DeliveryFlows from '@/ai/flows/delivery-flow';
import * as CashierFlows from '@/ai/flows/cashier-flow';
import * as AffiliationFlows from '@/ai/flows/affiliation-flow';

import { getFirestoreDb } from './firebase-server';
import { credicoraLevels, credicoraCompanyLevels } from './types';


// --- User and Profile Actions ---

export const getPublicProfile = ProfileFlows.getPublicProfileFlow;

export async function updateUser(userId: string, updates: Partial<User>) {
    await ProfileFlows.updateUserFlow({ userId, updates });
}

export async function updateUserProfileImage(userId: string, imageUrl: string) {
    await ProfileFlows.updateUserFlow({ userId, updates: { profileImage: imageUrl } });
}

export async function updateFullProfile(userId: string, data: ProfileSetupData, profileType: User['type']) {
    const db = await getFirestoreDb();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const existingData = userSnap.data() as User;
    const newProfileSetupData = { ...existingData.profileSetupData, ...data };
    await ProfileFlows.updateUserFlow({ userId, updates: { type: profileType, profileSetupData: newProfileSetupData } });
}

export async function deleteUser(userId: string) {
    await ProfileFlows.deleteUserFlow({ userId });
}

export async function toggleUserPause(userId: string, currentIsPaused: boolean) {
    await updateUser(userId, { isPaused: !currentIsPaused });
}

export async function toggleGps(userId: string, currentStatus: boolean) {
    await updateUser(userId, { isGpsActive: !currentStatus });
}

export async function deactivateTransactions(userId: string) {
    await updateUser(userId, { isTransactionsActive: false, 'profileSetupData.paymentDetails': deleteField() });
}

export async function activateTransactions(userId: string, paymentDetails: ProfileSetupData['paymentDetails']) {
    await updateUser(userId, { isTransactionsActive: true, 'profileSetupData.paymentDetails': paymentDetails });
}


// --- Verification and Auth Actions ---
export async function autoVerifyIdWithAI(user: User): Promise<VerificationOutput> {
    if (!user.name || !user.idNumber || !user.idDocumentUrl) {
      throw new Error("Faltan datos del usuario para la verificación.");
    }
    return VerificationFlows.autoVerifyIdWithAI({
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
    await PublicationFlows.createPublication(data);
}

export async function createProduct(data: CreateProductInput): Promise<string> {
    const productId = await PublicationFlows.createProduct(data);
    if (!productId) throw new Error("Failed to create product");
    return productId;
}

export async function removeGalleryImage(userId: string, imageId: string) {
    const db = await getFirestoreDb();
    await deleteFirestoreDoc(doc(db, 'publications', imageId));
}

export async function updateGalleryImage(ownerId: string, imageId: string, updates: Partial<{ description: string; imageDataUri?: string }>) {
    const db = await getFirestoreDb();
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

export async function addCommentToImage(ownerId: string, imageId: string, commentText: string, currentUser: User) {
    const db = await getFirestoreDb();
    const pubRef = doc(db, 'publications', imageId);
    const newComment: GalleryImageComment = {
        author: currentUser.name,
        text: commentText,
        profileImage: currentUser.profileImage,
        likes: 0,
        dislikes: 0,
    };
    await updateDoc(pubRef, {
        comments: arrayUnion(newComment)
    });
}

export async function removeCommentFromImage(ownerId: string, imageId: string, commentIndex: number) {
    const db = await getFirestoreDb();
    const pubRef = doc(db, 'publications', imageId);
    const pubSnap = await getDoc(pubRef);
    if (!pubSnap.exists()) return;
    const comments = (pubSnap.data()?.comments || []) as GalleryImageComment[];
    if (commentIndex >= 0 && commentIndex < comments.length) {
        const commentToRemove = comments[commentIndex];
        await updateDoc(pubRef, {
            comments: arrayRemove(commentToRemove)
        });
    }
}


// --- Transaction and Cart Actions ---

export async function updateCart(userId: string, productId: string, quantity: number) {
    const db = await getFirestoreDb();
    const q = query(collection(db, 'transactions'), where('clientId', '==', userId), where('status', '==', 'Carrito Activo'));
    const snapshot = await getDocs(q);
    
    // Find the cart (can be across multiple providers)
    let cartTxDoc = snapshot.docs.find(doc => {
      const tx = doc.data() as Transaction;
      return tx.details.items?.some(item => item.product.id === productId);
    });

    if (cartTxDoc) {
      // Cart exists, update it
      const txRef = doc(db, 'transactions', cartTxDoc.id);
      const items = cartTxDoc.data().details.items || [];
      const itemIndex = items.findIndex((i: CartItem) => i.product.id === productId);
      
      let newItems = [...items];
      if (itemIndex > -1) {
        if (quantity > 0) {
            newItems[itemIndex].quantity = quantity;
        } else {
            newItems.splice(itemIndex, 1);
        }
      } else if (quantity > 0) {
        // This should not happen if addToCart is used, but as a safeguard
        const productSnap = await getDoc(doc(db, 'publications', productId));
        if(productSnap.exists()) {
            const productData = productSnap.data();
            const product: Product = {
                id: productData.id,
                name: productData.productDetails?.name || '',
                price: productData.productDetails?.price || 0,
                description: productData.description || '',
                imageUrl: productData.src || '',
                providerId: productData.providerId,
                category: productData.productDetails?.category || '',
            }
            newItems.push({ product, quantity });
        }
      }
      
      if (newItems.length > 0) {
        await updateDoc(txRef, { 'details.items': newItems.map(item => ({...item, product: {...item.product}})) });
      } else {
        await deleteFirestoreDoc(txRef);
      }
    } else if (quantity > 0) {
        // No existing cart contains this item, create a new cart transaction for this provider
        const productSnap = await getDoc(doc(db, 'publications', productId));
        if (productSnap.exists()) {
            const productData = productSnap.data();
            const product: Product = {
                id: productData.id,
                name: productData.productDetails?.name || '',
                price: productData.productDetails?.price || 0,
                description: productData.description || '',
                imageUrl: productData.src || '',
                providerId: productData.providerId,
                category: productData.productDetails?.category || '',
            }
            const newCartItem: CartItem = { product, quantity };

            const newTxId = `txn-cart-${userId}-${Date.now()}`;
            const newCartTx: Transaction = {
                id: newTxId, type: 'Compra', status: 'Carrito Activo', date: new Date().toISOString(), amount: 0,
                clientId: userId, providerId: product.providerId, participantIds: [userId, product.providerId], details: { items: [newCartItem].map(item => ({...item, product: {...item.product}})) }
            };
            await setDoc(doc(db, 'transactions', newTxId), newCartTx);
        }
    }
}

export async function checkout(userId: string, providerId: string, deliveryMethod: string, useCredicora: boolean, recipientInfo?: { name: string, phone: string }, deliveryAddress?: string) {
    const db = await getFirestoreDb();
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
    
    await updateDoc(doc(db, 'transactions', cartTx.id), { 
        status: 'Buscando Repartidor',
        'details.delivery': deliveryDetails,
        'details.deliveryCost': 0, // Placeholder
        'details.paymentMethod': useCredicora ? 'credicora' : 'direct',
    });

    if (deliveryMethod !== 'pickup') {
        await DeliveryFlows.findDeliveryProvider({ transactionId: cartTx.id });
    }
}

export const { sendQuote, acceptQuote, acceptAppointment, confirmPaymentReceived, completeWork, confirmWorkReceived, startDispute, createAppointmentRequest, processDirectPayment } = TransactionFlows;

export async function payCommitment(transactionId: string, userId: string, paymentDetails: any) {
    return TransactionFlows.payCommitment({ transactionId, userId, paymentDetails });
}

// --- Messaging Actions ---

export async function sendMessage(options: SendMessageInput) {
    await MessageFlows.sendMessage(options);
}

export async function acceptProposal(conversationId: string, messageId: string, acceptorId: string) {
    await MessageFlows.acceptProposal({ conversationId, messageId, acceptorId });
}

export async function markConversationAsRead(conversationId: string, userId: string) {
    const db = await getFirestoreDb();
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
    return await CampaignFlows.createCampaign({ userId, ...data });
}

export async function activatePromotion(userId: string, details: { imageId: string, promotionText: string, cost: number }) {
    const db = await getFirestoreDb();
    await updateUser(userId, {
        promotion: { text: details.promotionText, expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
    });
    const pubRef = doc(db, 'publications', details.imageId);
    await updateDoc(pubRef, { isTemporary: false, 'promotion.text': details.promotionText, 'promotion.expires': new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() });
}

export async function registerSystemPayment(userId: string, concept: string, amount: number, isSubscription: boolean) {
    const db = await getFirestoreDb();
    const txId = `txn-sys-${userId.slice(-4)}-${Date.now()}`;
    const txData: Transaction = {
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
            isSubscription
        }
    };
    await setDoc(doc(db, 'transactions', txId), txData);
}

export async function cancelSystemTransaction(transactionId: string) {
    await deleteFirestoreDoc(doc(await getFirestoreDb(), 'transactions', transactionId));
}

// --- Admin Actions ---

export async function verifyCampaignPayment(transactionId: string, campaignId: string) {
    const db = await getFirestoreDb();
    const batch = writeBatch(db);
    batch.update(doc(db, 'transactions', transactionId), { status: 'Resuelto' });
    if(campaignId) {
      batch.update(doc(db, 'campaigns', campaignId), { status: 'active' });
    }
    await batch.commit();
}


// --- Affiliation Actions ---
export async function requestAffiliation(providerId: string, companyId: string) {
    // 1. Create the affiliation request
    await AffiliationFlows.requestAffiliationFlow({ providerId, companyId });

    // 2. Orchestrate sending the notification
    await NotificationFlows.sendNotification({
        userId: companyId,
        type: 'affiliation_request',
        title: 'Nueva Solicitud de Asociación',
        message: `Un proveedor desea asociarse como talento a tu empresa.`,
        link: `/admin` // Link to the management panel
    });
}
export const approveAffiliation = (affiliationId: string, actorId: string) => AffiliationFlows.approveAffiliationFlow({ affiliationId, actorId });
export const rejectAffiliation = (affiliationId: string, actorId: string) => AffiliationFlows.rejectAffiliationFlow({ affiliationId, actorId });
export const revokeAffiliation = (affiliationId: string, actorId: string) => AffiliationFlows.revokeAffiliationFlow({ affiliationId, actorId });

// --- QR Session Actions ---
export async function startQrSession(clientId: string, providerId: string, cashierBoxId?: string, cashierName?: string): Promise<string> {
    const db = await getFirestoreDb();
    const sessionId = `qrs-${clientId.slice(-5)}-${Date.now()}`;
    const sessionData: QrSession = {
      id: sessionId, providerId, clientId, cashierBoxId, cashierName, status: 'pendingAmount',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), participantIds: [clientId, providerId],
    };
    await setDoc(doc(db, 'qr_sessions', sessionId), sessionData);
    return sessionId;
}

export async function cancelQrSession(sessionId: string) {
    const db = await getFirestoreDb();
    await updateDoc(doc(db, 'qr_sessions', sessionId), { status: 'cancelled' });
}

export async function setQrSessionAmount(sessionId: string, amount: number, initialPayment: number, financedAmount: number, installments: number) {
    const db = await getFirestoreDb();
    await updateDoc(doc(db, 'qr_sessions', sessionId), { amount, initialPayment, financedAmount, installments, status: 'pendingClientApproval' });
}

export async function handleClientCopyAndPay(sessionId: string) {
    const db = await getFirestoreDb();
    await updateDoc(doc(db, 'qr_sessions', sessionId), { status: 'awaitingPayment', updatedAt: new Date().toISOString() });
}

export async function confirmMobilePayment(sessionId: string) {
    const db = await getFirestoreDb();
    await updateDoc(doc(db, 'qr_sessions', sessionId), { status: 'pendingVoucherUpload' });
}

export async function finalizeQrSession(sessionId: string) {
    await TransactionFlows.processDirectPayment({ sessionId });
    const db = await getFirestoreDb();
    await updateDoc(doc(db, 'qr_sessions', sessionId), { status: 'completed' });
}

// --- Cashier Box Actions ---
export async function addCashierBox(userId: string, name: string, password: string): Promise<void> {
    const newBox = await CashierFlows.createCashierBox({ userId, name, password });
    if (!newBox) throw new Error("Failed to create cashier box");
    const db = await getFirestoreDb();
    await updateDoc(doc(db, 'users', userId), {
        'profileSetupData.cashierBoxes': arrayUnion(newBox)
    });
}

export async function removeCashierBox(userId: string, boxId: string) {
    const db = await getFirestoreDb();
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
    const db = await getFirestoreDb();
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
    const newQrData = await CashierFlows.regenerateCashierQr({ boxId, userId });
    const db = await getFirestoreDb();
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

export async function requestCashierSession(data: { businessCoraboId: string, cashierName: string, cashierBoxId: string, password: string }) {
    return await CashierFlows.requestCashierSessionFlow(data);
}

// --- Delivery Actions ---
export const retryFindDelivery = DeliveryFlows.findDeliveryProvider;
export const resolveDeliveryAsPickup = DeliveryFlows.resolveDeliveryAsPickup;
export async function assignOwnDelivery(transactionId: string, userId: string) {
    await updateDoc(doc(await getFirestoreDb(), 'transactions', transactionId), {
        'details.deliveryProviderId': userId,
        status: 'En Reparto',
    });
}


// --- Quote Actions ---
export async function requestQuoteFromGroup(title: string, items: string[], group: string) {
    // In a real app, this would trigger a flow to find relevant providers and create transactions
    console.log("Requesting quote from group:", { title, items, group });
}

export async function subscribeUser(userId: string, title: string, amount: number) {
    return registerSystemPayment(userId, title, amount, true);
}

// --- Notification Actions ---
export const sendNewCampaignNotifications = NotificationFlows.sendNewCampaignNotifications;
