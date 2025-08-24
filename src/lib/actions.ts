
'use server';
/**
 * @fileOverview Server Actions for the Corabo application.
 * This file serves as the PRIMARY and SOLE bridge between client-side components and server-side Genkit flows.
 * All functions exported from this file are marked as server actions and will only execute on the server.
 * Client components should ONLY import from this file to interact with the backend.
 */

import {
  getOrCreateUserFlow,
  FirebaseUserInput,
} from '@/ai/flows/auth-flow';
import {
  completeInitialSetupFlow,
  checkIdUniquenessFlow,
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
  acceptProposal as acceptProposalFlow,
  SendMessageInput,
  AcceptProposalInput,
} from '@/ai/flows/message-flow';
import {
  autoVerifyIdWithAIFlow,
  VerificationInput,
} from '@/ai/flows/verification-flow';
import {
  completeWork as completeWorkFlow,
  confirmWorkReceived as confirmWorkReceivedFlow,
  payCommitment as payCommitmentFlow,
  confirmPaymentReceived as confirmPaymentReceivedFlow,
  sendQuote as sendQuoteFlow,
  acceptAppointment as acceptAppointmentFlow,
  createAppointmentRequest as createAppointmentRequestFlow,
  startDispute as startDisputeFlow,
  cancelSystemTransaction as cancelSystemTransactionFlow,
  downloadTransactionsPDF as downloadTransactionsPDFFlow,
  checkout as checkoutFlow,
  processDirectPayment,
} from '@/ai/flows/transaction-flow';
import {
  findDeliveryProvider,
  resolveDeliveryAsPickup as resolveDeliveryAsPickupFlow,
} from '@/ai/flows/delivery-flow';
import {
  approveAffiliation as approveAffiliationFlow,
  rejectAffiliation as rejectAffiliationFlow,
  revokeAffiliation as revokeAffiliationFlow,
  requestAffiliation as requestAffiliationFlow,
} from '@/ai/flows/affiliation-flow';
import { createCampaign as createCampaignFlow } from '@/ai/flows/campaign-flow';
import { sendNewCampaignNotifications as sendNewCampaignNotificationsFlow } from '@/ai/flows/notification-flow';
import {
  createCashierBox as createCashierBoxFlow,
  regenerateCashierQr as regenerateCashierQrFlow,
  requestCashierSession as requestCashierSessionFlow,
} from '@/ai/flows/cashier-flow';

import type { User, ProfileSetupData, Transaction, Product, CartItem, GalleryImage, VerificationOutput, CashierBox, QrSession, TempRecipientInfo } from '@/lib/types';
import { CreatePublicationInput, CreateProductInput } from '@/lib/types';
import { getFirestore, writeBatch, doc, updateDoc, arrayUnion, arrayRemove, increment, setDoc, deleteDoc, getDoc, query, collection, where, getDocs, orderBy, limit, FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from './firebase-server';

// =================================
// AUTH & USER ACTIONS
// =================================

export async function getOrCreateUser(firebaseUser: FirebaseUserInput) {
  const user = await getOrCreateUserFlow(firebaseUser);
  return JSON.parse(JSON.stringify(user));
}

export async function updateUser(
  userId: string,
  updates: Partial<
    User | { 'profileSetupData.serviceRadius': number } | { 'profileSetupData.cashierBoxes': CashierBox[] }
  >
) {
  const { firestore } = getFirebaseAdmin();
  await updateDoc(doc(firestore, 'users', userId), updates as any);
}

export async function deleteUser(userId: string) {
  const { firestore } = getFirebaseAdmin();
  await deleteDoc(doc(firestore, 'users', userId));
}

export async function getPublicProfile(userId: string) {
  const { firestore } = getFirebaseAdmin();
  const userSnap = await getDoc(doc(firestore, 'users', userId));
  if (!userSnap.exists()) return null;
  return userSnap.data() as User;
}

export async function getFeed(params: {
  limitNum: number;
  startAfterDocId?: string;
}) {
  const { firestore } = getFirebaseAdmin();
  const qConstraints = [orderBy('createdAt', 'desc'), limit(params.limitNum)];
  if (params.startAfterDocId) {
    // Implement cursor logic if needed
  }
  const publicationsQuery = query(
    collection(firestore, 'publications'),
    ...qConstraints
  );
  const snapshot = await getDocs(publicationsQuery);
  const publications = snapshot.docs.map(
    (doc) => doc.data() as GalleryImage
  );

  const ownerIds = [...new Set(publications.map((p) => p.providerId))];
  if (ownerIds.length === 0) {
    return { publications, lastVisibleDocId: null };
  }
  const ownersQuery = query(
    collection(firestore, 'users'),
    where('id', 'in', ownerIds)
  );
  const ownersSnap = await getDocs(ownersQuery);
  const ownersMap = new Map(
    ownersSnap.docs.map((d) => [d.id, d.data() as User])
  );

  const enrichedPublications = publications.map((pub) => ({
    ...pub,
    owner: ownersMap.get(pub.providerId),
  }));

  return {
    publications: enrichedPublications,
    lastVisibleDocId: snapshot.docs[snapshot.docs.length - 1]?.id || null,
  };
}

// =================================
// SETUP ACTIONS
// =================================

export async function completeInitialSetup(userId: string, data: any) {
  return await completeInitialSetupFlow({ userId, ...data });
}

export async function checkIdUniqueness(data: {
  idNumber: string;
  country: string;
  currentUserId: string;
}) {
  return await checkIdUniquenessFlow(data);
}

export async function updateFullProfile(
  userId: string,
  profileData: ProfileSetupData,
  userType: User['type']
) {
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

export async function autoVerifyIdWithAI(
  user: User
): Promise<VerificationOutput | null> {
  const input: VerificationInput = {
    userId: user.id,
    nameInRecord: `${user.name} ${user.lastName || ''}`.trim(),
    idInRecord: user.idNumber || '',
    documentImageUrl: user.idDocumentUrl || '',
    isCompany: user.profileSetupData?.providerType === 'company',
  };
  try {
    return await autoVerifyIdWithAIFlow(input);
  } catch (e) {
    console.error('AI flow failed:', e);
    return null;
  }
}


// =================================
// PUBLICATION ACTIONS
// =================================

export async function createPublication(data: CreatePublicationInput) {
  await createPublicationFlow(data);
}

export async function createProduct(data: CreateProductInput) {
  await createProductFlow(data);
}

export async function removeGalleryImage(ownerId: string, imageId: string) {
  await removeGalleryImageFlow({ownerId, imageId});
}

export async function updateGalleryImage(data: { ownerId: string; imageId: string; updates: { description?: string; imageDataUri?: string; }; }) {
  await updateGalleryImageFlow(data);
}

export async function addCommentToImage(data: { ownerId: string; imageId: string; commentText: string; author: { id: string; name: string; profileImage: string; }; }) {
  await addCommentToImageFlow(data);
}

export async function removeCommentFromImage(data: { ownerId: string; imageId: string; commentIndex: number; }) {
  await removeCommentFromImageFlow(data);
}

// =================================
// MESSAGE ACTIONS
// =================================

export async function sendMessage(input: SendMessageInput) {
  await sendMessageFlow(input);
  return input.conversationId;
}

export async function acceptProposal(conversationId: string, messageId: string, acceptorId: string) {
    await acceptProposalFlow({ conversationId, messageId, acceptorId });
}

export async function markConversationAsRead(conversationId: string) {
    // This is a client-side concern, but a placeholder in case backend logic is needed.
}


// =================================
// TRANSACTION ACTIONS
// =================================

export async function createAppointmentRequest(data: any) {
    await createAppointmentRequestFlow(data);
}

export async function completeWork(data: {
  transactionId: string;
  userId: string;
}) {
  await completeWorkFlow(data);
}

export async function confirmWorkReceived(data: {
  transactionId: string;
  userId: string;
  rating: number;
  comment: string;
}) {
  await confirmWorkReceivedFlow(data);
}

export async function payCommitment(data: any) {
  await payCommitmentFlow(data);
}

export async function confirmPaymentReceived(data: {
  transactionId: string;
  userId: string;
  fromThirdParty: boolean;
}) {
  await confirmPaymentReceivedFlow(data);
}

export async function sendQuote(data: any) {
  await sendQuoteFlow(data);
}

export async function acceptAppointment(data: {
  transactionId: string;
  userId: string;
}) {
  await acceptAppointmentFlow(data);
}

export async function startDispute(transactionId: string) {
  await startDisputeFlow(transactionId);
}

export async function cancelSystemTransaction(transactionId: string) {
  await cancelSystemTransactionFlow(transactionId);
}

export async function downloadTransactionsPDF(transactions: Transaction[]) {
  return await downloadTransactionsPDFFlow(transactions);
}

export async function checkout(
  userId: string,
  providerId: string,
  deliveryMethod: string,
  useCredicora: boolean,
  recipientInfo?: { name: string; phone: string },
  deliveryAddress?: string
) {
  await checkoutFlow({
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
  const cartTxRef = doc(firestore, 'transactions', `cart-${userId}`);
  const cartTxSnap = await getDoc(cartTxRef);
  const productRef = doc(firestore, 'publications', productId);
  const productSnap = await getDoc(productRef);

  if (!productSnap.exists()) {
    console.error(`Product ${productId} not found!`);
    return;
  }

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

  if (cartTxSnap.exists()) {
    const cartItems =
      (cartTxSnap.data()?.details.items || []) as CartItem[];
    const itemIndex = cartItems.findIndex(
      (item) => item.product.id === productId
    );

    if (newQuantity <= 0) {
      if (itemIndex > -1) {
        const itemToRemove = cartItems[itemIndex];
        await updateDoc(cartTxRef, {
          'details.items': FieldValue.arrayRemove(itemToRemove),
        });
      }
    } else {
      if (itemIndex > -1) {
        // This is tricky without reading the array, updating, and writing back.
        // For simplicity, we'll do read-modify-write.
        const updatedItems = [...cartItems];
        updatedItems[itemIndex].quantity = newQuantity;
        await updateDoc(cartTxRef, { 'details.items': updatedItems });
      } else {
        await updateDoc(cartTxRef, {
          'details.items': FieldValue.arrayUnion({ product, quantity: newQuantity }),
        });
      }
    }
  } else if (newQuantity > 0) {
    const newCart: Transaction = {
      id: `cart-${userId}`,
      type: 'Compra',
      status: 'Carrito Activo',
      date: new Date().toISOString(),
      amount: 0,
      participantIds: [userId],
      clientId: userId,
      providerId: '', // Cart can contain items from multiple providers
      details: {
        items: [{ product, quantity: newQuantity }],
      },
    };
    await setDoc(cartTxRef, newCart);
  }
}

// =================================
// DELIVERY ACTIONS
// =================================

export async function retryFindDelivery(data: { transactionId: string }) {
  await findDeliveryProvider(data);
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
  await resolveDeliveryAsPickupFlow(data);
}

// =================================
// AFFILIATION ACTIONS
// =================================
export async function requestAffiliation(providerId: string, companyId: string) {
  await requestAffiliationFlow({ providerId, companyId });
}

export async function approveAffiliation(affiliationId: string, actorId: string) {
  await approveAffiliationFlow({ affiliationId, actorId });
}

export async function rejectAffiliation(affiliationId: string, actorId: string) {
  await rejectAffiliationFlow({ affiliationId, actorId });
}

export async function revokeAffiliation(affiliationId: string, actorId: string) {
  await revokeAffiliationFlow({ affiliationId, actorId });
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
  await sendNewCampaignNotificationsFlow(data);
}

// =================================
// CASHIER & QR ACTIONS
// =================================

export async function addCashierBox(userId: string, name: string, password: string) {
  const newBox = await createCashierBoxFlow({ userId, name, password });
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
  const newQr = await regenerateCashierQrFlow({ userId, boxId });
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
  return await requestCashierSessionFlow(data);
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
  await processDirectPayment({ sessionId });
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
  return await createCampaignFlow({ userId, ...data });
}
