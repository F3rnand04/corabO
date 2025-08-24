
'use server';
/**
 * @fileOverview Server Actions for the Corabo application.
 * This file serves as the PRIMARY and SOLE bridge between client-side components and server-side Genkit flows.
 * All functions exported from this file are marked as server actions and will only execute on the server.
 * Client components should ONLY import from this file to interact with the backend.
 */
import { ai } from '@/ai/genkit';
import { getFirebaseAdmin } from './firebase-server';
import { doc, updateDoc, writeBatch, FieldValue, setDoc, deleteDoc, getDoc, query, collection, where, getDocs, orderBy, limit } from 'firebase-admin/firestore';
import type { FirebaseUserInput } from '@/ai/flows/auth-flow';
import type { User, ProfileSetupData, Transaction, Product, CartItem, GalleryImage, CreatePublicationInput, CreateProductInput, VerificationOutput, CashierBox, QrSession, TempRecipientInfo } from '@/lib/types';


// =================================
// AUTH & USER ACTIONS
// =================================

export async function getOrCreateUser(firebaseUser: FirebaseUserInput) {
  return await ai.runFlow('getOrCreateUserFlow', firebaseUser);
}

export async function updateUser(userId: string, updates: Partial<User | { 'profileSetupData.serviceRadius': number } | { 'profileSetupData.cashierBoxes': CashierBox[] }>) {
    const { firestore } = getFirebaseAdmin();
    await updateDoc(doc(firestore, 'users', userId), updates as any);
}

export async function deleteUser(userId: string) {
    const { firestore } = getFirebaseAdmin();
    await deleteDoc(doc(firestore, 'users', userId));
}

export async function getPublicProfile(userId: string) {
    return await ai.runFlow('getPublicProfileFlow', { userId });
}

export async function getFeed(params: { limitNum: number, startAfterDocId?: string }) {
   return await ai.runFlow('getFeedFlow', params);
}

// =================================
// SETUP ACTIONS
// =================================

export async function completeInitialSetup(userId: string, data: any) {
    return await ai.runFlow('completeInitialSetupFlow', { userId, ...data });
}

export async function checkIdUniqueness(data: { idNumber: string; country: string; currentUserId: string; }) {
    return await ai.runFlow('checkIdUniquenessFlow', data);
}

export async function updateFullProfile(userId: string, profileData: ProfileSetupData, userType: User['type']) {
    await updateUser(userId, { profileSetupData, type: userType });
}

export async function updateUserProfileImage(userId: string, dataUrl: string) {
    await updateUser(userId, { profileImage: dataUrl });
}

export async function toggleGps(userId: string) {
    const { firestore } = getFirebaseAdmin();
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const currentStatus = userSnap.data()?.isGpsActive || false;
        await updateDoc(userRef, { isGpsActive: !currentStatus });
    }
}

export async function deactivateTransactions(userId: string) {
    await updateUser(userId, { isTransactionsActive: false });
}

export async function verifyUserId(userId: string) {
    await updateUser(userId, { idVerificationStatus: 'verified', verified: true });
}

export async function rejectUserId(userId: string) {
    await updateUser(userId, {
        idVerificationStatus: 'rejected',
        verified: false,
    });
}

export async function autoVerifyIdWithAI(user: User): Promise<VerificationOutput | null> {
    const input = {
      userId: user.id,
      nameInRecord: `${user.name} ${user.lastName || ''}`.trim(),
      idInRecord: user.idNumber || '',
      documentImageUrl: user.idDocumentUrl || '',
      isCompany: user.profileSetupData?.providerType === 'company',
    };
    try {
        return await ai.runFlow('autoVerifyIdWithAIFlow', input);
    } catch (e) {
        console.error("AI flow failed:", e);
        return null;
    }
}


// =================================
// PUBLICATION ACTIONS
// =================================

export async function createPublication(data: CreatePublicationInput) {
    await ai.runFlow('createPublicationFlow', data);
}

export async function createProduct(data: CreateProductInput) {
    await ai.runFlow('createProductFlow', data);
}

export async function removeGalleryImage(ownerId: string, imageId: string) {
    const { firestore } = getFirebaseAdmin();
    await deleteDoc(doc(firestore, 'publications', imageId));
}

export async function updateGalleryImage(data: { ownerId: string; imageId: string; updates: { description?: string; imageDataUri?: string; }; }) {
    await ai.runFlow('updateGalleryImageFlow', data);
}

export async function addCommentToImage(data: { ownerId: string; imageId: string; commentText: string; author: { id: string; name: string; profileImage: string; }; }) {
    await ai.runFlow('addCommentToImageFlow', data);
}

export async function removeCommentFromImage(data: { ownerId: string; imageId: string; commentIndex: number; }) {
    await ai.runFlow('removeCommentFromImageFlow', data);
}

// =================================
// MESSAGE ACTIONS
// =================================

export async function sendMessage(input: any) {
  await ai.runFlow('sendMessageFlow', input);
  return input.conversationId;
}

export async function acceptProposal(conversationId: string, messageId: string, acceptorId: string) {
    await ai.runFlow('acceptProposalFlow', { conversationId, messageId, acceptorId });
}

export async function markConversationAsRead(conversationId: string) {
    // This is a client-side concern, but a placeholder in case backend logic is needed.
}


// =================================
// TRANSACTION ACTIONS
// =================================

export async function createAppointmentRequest(data: any) {
    await ai.runFlow('createAppointmentRequestFlow', data);
}

export async function completeWork(data: {
  transactionId: string;
  userId: string;
}) {
  await ai.runFlow('completeWorkFlow', data);
}

export async function confirmWorkReceived(data: {
  transactionId: string;
  userId: string;
  rating: number;
  comment: string;
}) {
  await ai.runFlow('confirmWorkReceivedFlow', data);
}

export async function payCommitment(data: any) {
  await ai.runFlow('payCommitmentFlow', data);
}

export async function confirmPaymentReceived(data: {
  transactionId: string;
  userId: string;
  fromThirdParty: boolean;
}) {
  await ai.runFlow('confirmPaymentReceivedFlow', data);
}

export async function sendQuote(data: any) {
  await ai.runFlow('sendQuoteFlow', data);
}

export async function acceptAppointment(data: {
  transactionId: string;
  userId: string;
}) {
  await ai.runFlow('acceptAppointmentFlow', data);
}

export async function startDispute(transactionId: string) {
  await ai.runFlow('startDisputeFlow', transactionId);
}

export async function cancelSystemTransaction(transactionId: string) {
    const { firestore } = getFirebaseAdmin();
    await deleteDoc(doc(firestore, 'transactions', transactionId));
}

export async function downloadTransactionsPDF(transactions: Transaction[]) {
  return await ai.runFlow('downloadTransactionsPDFFlow', transactions);
}

export async function checkout(
  userId: string,
  providerId: string,
  deliveryMethod: string,
  useCredicora: boolean,
  recipientInfo?: { name: string; phone: string },
  deliveryAddress?: string
) {
  await ai.runFlow('checkoutFlow', {
    userId,
    providerId,
    deliveryMethod,
    useCredicora,
    recipientInfo,
    deliveryAddress,
  });
}

export async function updateCart(
  userId: string,
  productId: string,
  newQuantity: number
) {
    const { firestore } = getFirebaseAdmin();
    const q = query(
        collection(firestore, 'transactions'), 
        where('clientId', '==', userId), 
        where('status', '==', 'Carrito Activo')
    );
    const snapshot = await getDocs(q);
    const cartTxDoc = snapshot.docs[0];
    const productSnap = await getDoc(doc(firestore, 'publications', productId));
    if (!productSnap.exists()) return;

    const productData = productSnap.data() as GalleryImage;
    const product: Product = {
        id: productData.id,
        name: productData.productDetails!.name,
        description: productData.description,
        price: productData.productDetails!.price,
        category: productData.productDetails!.category,
        providerId: productData.providerId,
        imageUrl: productData.src,
    };

    if (cartTxDoc) {
        const cartTxRef = cartTxDoc.ref;
        const currentItems = (cartTxDoc.data()?.details.items || []) as CartItem[];
        const updatedItems = currentItems.filter(item => item.product.id !== productId);
        if (newQuantity > 0) {
            updatedItems.push({ product, quantity: newQuantity });
        }
        await updateDoc(cartTxRef, { 'details.items': updatedItems });
    } else if (newQuantity > 0) {
        const newCart: Transaction = {
            id: `cart-${userId}`,
            type: 'Compra',
            status: 'Carrito Activo',
            date: new Date().toISOString(),
            amount: 0,
            participantIds: [userId],
            clientId: userId,
            providerId: '',
            details: { items: [{ product, quantity: newQuantity }] },
        };
        await setDoc(doc(firestore, 'transactions', `cart-${userId}`), newCart);
    }
}


// =================================
// DELIVERY ACTIONS
// =================================

export async function retryFindDelivery(data: { transactionId: string }) {
  await ai.runFlow('findDeliveryProvider', data);
}

export async function assignOwnDelivery(
  transactionId: string,
  providerId: string
) {
  const { firestore } = getFirebaseAdmin();
  await updateDoc(doc(firestore, 'transactions', transactionId), {
    'details.deliveryProviderId': providerId,
    status: 'En Reparto',
  });
}

export async function resolveDeliveryAsPickup(data: { transactionId: string }) {
  await ai.runFlow('resolveDeliveryAsPickupFlow', data);
}

// =================================
// AFFILIATION ACTIONS
// =================================
export async function requestAffiliation(providerId: string, companyId: string) {
  await ai.runFlow('requestAffiliationFlow', { providerId, companyId });
}

export async function approveAffiliation(affiliationId: string, actorId: string) {
  await ai.runFlow('approveAffiliationFlow', { affiliationId, actorId });
}

export async function rejectAffiliation(affiliationId: string, actorId: string) {
  await ai.runFlow('rejectAffiliationFlow', { affiliationId, actorId });
}

export async function revokeAffiliation(affiliationId: string, actorId: string) {
  await ai.runFlow('revokeAffiliationFlow', { affiliationId, actorId });
}

// =================================
// ADMIN & PAYMENT ACTIONS
// =================================

export async function toggleUserPause(userId: string, isCurrentlyPaused: boolean) {
  await updateUser(userId, { isPaused: !isCurrentlyPaused });
}

export async function verifyCampaignPayment(
  transactionId: string,
  campaignId?: string
) {
  const { firestore } = getFirebaseAdmin();
  const batch = writeBatch(firestore);

  batch.update(doc(firestore, 'transactions', transactionId), {
    status: 'Pagado',
  });

  if (campaignId) {
    batch.update(doc(firestore, 'campaigns', campaignId), { status: 'active' });
  } else {
    // This is a subscription payment, update the user
    const txSnap = await getDoc(doc(firestore, 'transactions', transactionId));
    if (txSnap.exists()) {
      const userId = txSnap.data()?.clientId;
      if (userId) {
        batch.update(doc(firestore, 'users', userId), { isSubscribed: true });
      }
    }
  }

  await batch.commit();
}

export async function sendNewCampaignNotifications(data: {
  campaignId: string;
}) {
  await ai.runFlow('sendNewCampaignNotificationsFlow', data);
}

// =================================
// CASHIER & QR ACTIONS
// =================================

export async function addCashierBox(userId: string, name: string, password: string) {
  const newBox = await ai.runFlow('createCashierBoxFlow', { userId, name, password });
  const { firestore } = getFirebaseAdmin();
  await updateDoc(doc(firestore, 'users', userId), {
    'profileSetupData.cashierBoxes': FieldValue.arrayUnion(newBox),
  });
}

export async function updateCashierBox(
  userId: string,
  boxId: string,
  updates: Partial<CashierBox>
) {
  const { firestore } = getFirebaseAdmin();
  const userRef = doc(firestore, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const user = userSnap.data() as User;
    const boxes = user.profileSetupData?.cashierBoxes || [];
    const updatedBoxes = boxes.map((box) =>
      box.id === boxId ? { ...box, ...updates } : box
    );
    await updateDoc(userRef, { 'profileSetupData.cashierBoxes': updatedBoxes });
  }
}

export async function removeCashierBox(userId: string, boxId: string) {
  const { firestore } = getFirebaseAdmin();
  const userRef = doc(firestore, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const user = userSnap.data() as User;
    const boxes = user.profileSetupData?.cashierBoxes || [];
    const boxToRemove = boxes.find((box) => box.id === boxId);
    if (boxToRemove) {
      await updateDoc(userRef, {
        'profileSetupData.cashierBoxes': FieldValue.arrayRemove(boxToRemove),
      });
    }
  }
}

export async function regenerateCashierBoxQr(userId: string, boxId: string) {
  const newQr = await ai.runFlow('regenerateCashierQrFlow', { userId, boxId });
  await updateCashierBox(userId, boxId, {
    qrValue: newQr.qrValue,
    qrDataURL: newQr.qrDataURL,
  });
}

export async function requestCashierSession(data: {
  businessCoraboId: string;
  cashierName: string;
  cashierBoxId: string;
  password: string;
}) {
  return await ai.runFlow('requestCashierSessionFlow', data);
}

export async function startQrSession(
  clientId: string,
  providerId: string,
  cashierBoxId?: string
) {
  const { firestore } = getFirebaseAdmin();
  const sessionId = `qrs-${Date.now()}`;
  await setDoc(doc(firestore, 'qr_sessions', sessionId), {
    id: sessionId,
    clientId,
    providerId,
    cashierBoxId: cashierBoxId || null,
    status: 'pendingAmount',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participantIds: [clientId, providerId],
  });
  return sessionId;
}

export async function setQrSessionAmount(
  sessionId: string,
  amount: number,
  initialPayment: number,
  financedAmount: number,
  installments: number
) {
  const { firestore } = getFirebaseAdmin();
  await updateDoc(doc(firestore, 'qr_sessions', sessionId), {
    amount,
    initialPayment,
    financedAmount,
    installments,
    status: 'pendingClientApproval',
    updatedAt: new Date().toISOString(),
  });
}

export async function handleClientCopyAndPay(sessionId: string) {
  const { firestore } = getFirebaseAdmin();
  await updateDoc(doc(firestore, 'qr_sessions', sessionId), {
    status: 'awaitingPayment',
    updatedAt: new Date().toISOString(),
  });
}

export async function cancelQrSession(sessionId: string) {
  const { firestore } = getFirebaseAdmin();
  await updateDoc(doc(firestore, 'qr_sessions', sessionId), {
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  });
}

export async function confirmMobilePayment(sessionId: string) {
  const { firestore } = getFirebaseAdmin();
  await updateDoc(doc(firestore, 'qr_sessions', sessionId), {
    status: 'pendingVoucherUpload',
    updatedAt: new Date().toISOString(),
  });
}

export async function finalizeQrSession(sessionId: string) {
  await ai.runFlow('processDirectPayment', { sessionId });
  const { firestore } = getFirebaseAdmin();
  await updateDoc(doc(firestore, 'qr_sessions', sessionId), {
    status: 'completed',
    updatedAt: new Date().toISOString(),
  });
}

export async function subscribeUser(
  userId: string,
  plan: string,
  amount: number
) {
  // This is a simplified version. A real one would involve a payment provider.
  const { firestore } = getFirebaseAdmin();
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, { isSubscribed: true });

  // Create a transaction record for the subscription
  const txId = `txn-sub-${Date.now()}`;
  const newTransaction: Transaction = {
    id: txId,
    type: 'Sistema',
    status: 'Pago Enviado - Esperando Confirmación',
    date: new Date().toISOString(),
    amount: amount,
    clientId: userId,
    providerId: 'corabo-admin',
    participantIds: [userId, 'corabo-admin'],
    details: {
      system: `Pago de Suscripción: ${plan}`,
      isSubscription: true,
      isRenewable: true, // Assuming subscriptions are renewable
      paymentVoucherUrl: 'https://i.postimg.cc/L8y2zWc2/vzla-id.png', // Placeholder
    },
  };
  await setDoc(doc(firestore, 'transactions', txId), newTransaction);
}

export async function activatePromotion(
  userId: string,
  data: { imageId: string; promotionText: string; cost: number }
) {
  const { firestore } = getFirebaseAdmin();
  const batch = writeBatch(firestore);

  const userRef = doc(firestore, 'users', userId);
  const pubRef = doc(firestore, 'publications', data.imageId);
  const txRef = doc(firestore, 'transactions', `txn-promo-${Date.now()}`);

  const expires = new Date();
  expires.setHours(expires.getHours() + 24);

  batch.update(userRef, {
    'promotion.text': data.promotionText,
    'promotion.expires': expires.toISOString(),
  });
  batch.update(pubRef, {
    'promotion.text': data.promotionText,
    'promotion.expires': expires.toISOString(),
  });

  const promoTx: Transaction = {
    id: txRef.id,
    type: 'Sistema',
    status: 'Pago Enviado - Esperando Confirmación',
    date: new Date().toISOString(),
    amount: data.cost,
    clientId: userId,
    providerId: 'corabo-admin',
    participantIds: [userId, 'corabo-admin'],
    details: {
      system: `Pago por Promoción 24h: ${data.promotionText}`,
      paymentVoucherUrl: 'https://i.postimg.cc/L8y2zWc2/vzla-id.png',
    },
  };
  batch.set(txRef, promoTx);

  await batch.commit();
}

export async function registerSystemPayment(
  userId: string,
  concept: string,
  amount: number,
  isSubscription: boolean
) {
  const { firestore } = getFirebaseAdmin();
  const txId = `txn-sys-${Date.now()}`;
  const newTransaction: Transaction = {
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
      isRenewable: isSubscription,
      paymentVoucherUrl: 'https://i.postimg.cc/L8y2zWc2/vzla-id.png', // Placeholder
    },
  };
  await setDoc(doc(firestore, 'transactions', txId), newTransaction);
}

export async function createCampaign(userId: string, data: any) {
  return await ai.runFlow('createCampaignFlow', { userId, ...data });
}
