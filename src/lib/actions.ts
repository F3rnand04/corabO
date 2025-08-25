
'use server';
/**
 * @fileOverview Server Actions for the Corabo application.
 * This file serves as the PRIMARY and SOLE bridge between client-side components and server-side Genkit flows.
 * This means ALL data fetching, mutations, and interactions with the backend (Firebase, Genkit flows, etc.)
 * from client components MUST go through the functions defined and exported in this file.
 * All functions exported from this file are marked as server actions and will only execute on the server.
 */
import type { User, ProfileSetupData, Transaction, Product, CartItem, GalleryImage, CreatePublicationInput, CreateProductInput, VerificationOutput, CashierBox, QrSession, TempRecipientInfo, FirebaseUserInput } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Import all flows statically, using aliases to prevent name collisions.
import { getOrCreateUserFlow } from '@/ai/flows/auth-flow';
import { 
    updateUserFlow, 
    deleteUserFlow, 
    getPublicProfileFlow, 
    checkIdUniquenessFlow, 
    completeInitialSetupFlow, 
    toggleGpsFlow, 
    getProfileGalleryFlow, 
    getProfileProductsFlow 
} from '@/ai/flows/profile-flow';
import { 
    createPublicationFlow, 
    createProductFlow, 
    addCommentToImageFlow, 
    removeCommentFromImageFlow, 
    updateGalleryImageFlow, 
    removeGalleryImageFlow 
} from '@/ai/flows/publication-flow';
import { 
    sendMessage as sendMessageFlow, 
    acceptProposal as acceptProposalFlow 
} from '@/ai/flows/message-flow';
import { 
    completeWork as completeWorkFlow, 
    confirmWorkReceived as confirmWorkReceivedFlow, 
    payCommitment as payCommitmentFlow, 
    confirmPaymentReceived as confirmPaymentReceivedFlow, 
    sendQuote as sendQuoteFlow, 
    acceptAppointment as acceptAppointmentFlow, 
    startDispute as startDisputeFlow, 
    cancelSystemTransaction as cancelSystemTransactionFlow, 
    downloadTransactionsPDF as downloadTransactionsPDFFlow, 
    checkout as checkoutFlow, 
    processDirectPayment as processDirectPaymentFlow,
    createAppointmentRequest as createAppointmentRequestFlow
} from '@/ai/flows/transaction-flow';
import { 
    findDeliveryProvider as findDeliveryProviderFlow, 
    resolveDeliveryAsPickup as resolveDeliveryAsPickupFlow 
} from '@/ai/flows/delivery-flow';
import { 
    requestAffiliationFlow,
    approveAffiliationFlow,
    rejectAffiliationFlow,
    revokeAffiliationFlow
} from '@/ai/flows/affiliation-flow';
import { 
    createCashierBox as createCashierBoxFlow, 
    regenerateCashierQr as regenerateCashierQrFlow
} from '@/ai/flows/cashier-flow';
import { autoVerifyIdWithAI as autoVerifyIdWithAIFlow } from '@/ai/flows/verification-flow';
import { sendNewCampaignNotifications as sendNewCampaignNotificationsFlow } from '@/ai/flows/notification-flow';
import { updateCartFlow } from '@/ai/flows/cart-flow';
import { getFeed as getFeedFlow } from '@/ai/flows/feed-flow';
import { createCampaign as createCampaignFlow } from '@/ai/flows/campaign-flow';

// =================================
// AUTH & USER ACTIONS
// =================================

export async function getOrCreateUser(firebaseUser: FirebaseUserInput): Promise<User | null> {
  return await getOrCreateUserFlow(firebaseUser);
}

export async function updateUser(userId: string, updates: Partial<User | { 'profileSetupData.serviceRadius': number } | { 'profileSetupData.cashierBoxes': CashierBox[] }>) {
    await updateUserFlow({ userId, updates });
    revalidatePath('/profile');
    revalidatePath('/admin');
}

export async function deleteUser(userId: string) {
    await deleteUserFlow({ userId });
    revalidatePath('/admin');
}

export async function getPublicProfile(userId: string): Promise<Partial<User> | null> {
    return await getPublicProfileFlow({ userId });
}

export async function getFeed(params: { limitNum: number, startAfterDocId?: string }) {
    return await getFeedFlow(params);
}

// =================================
// SETUP ACTIONS
// =================================

export async function completeInitialSetup(userId: string, data: any): Promise<User | null> {
    const user = await completeInitialSetupFlow({ userId, ...data });
    revalidatePath('/initial-setup');
    revalidatePath('/');
    return user;
}

export async function checkIdUniqueness(data: { idNumber: string; country: string; currentUserId: string; }): Promise<boolean> {
    return await checkIdUniquenessFlow(data);
}

export async function updateFullProfile(userId: string, profileData: ProfileSetupData, userType: User['type']) {
    await updateUser(userId, { profileSetupData: profileData, type: userType });
    revalidatePath('/profile-setup/details');
}

export async function updateUserProfileImage(userId: string, dataUrl: string) {
    await updateUser(userId, { profileImage: dataUrl });
    revalidatePath('/profile');
}

export async function toggleGps(userId: string) {
    await toggleGpsFlow({ userId });
    revalidatePath('/profile');
}

export async function deactivateTransactions(userId: string) {
    await updateUser(userId, { isTransactionsActive: false });
    revalidatePath('/transactions/settings');
}

export async function verifyUserId(userId: string) {
    await updateUser(userId, { idVerificationStatus: 'verified', verified: true });
    revalidatePath('/admin');
}

export async function rejectUserId(userId: string) {
    await updateUser(userId, {
        idVerificationStatus: 'rejected',
        verified: false,
    });
    revalidatePath('/admin');
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
      return await autoVerifyIdWithAIFlow(input);
  } catch (e) {
      console.error("AI flow failed:", e);
      return null;
  }
}


// =================================
// PUBLICATION ACTIONS
// =================================

export async function createPublication(data: CreatePublicationInput) {
    await createPublicationFlow(data);
    revalidatePath('/profile/publications');
}

export async function createProduct(data: CreateProductInput) {
    await createProductFlow(data);
    revalidatePath('/profile/catalog');
}

export async function removeGalleryImage(ownerId: string, imageId: string) {
    await removeGalleryImageFlow({ imageId });
    revalidatePath(`/companies/${ownerId}`);
    revalidatePath('/profile/publications');
}

export async function updateGalleryImage(data: { ownerId: string; imageId: string; updates: { description?: string; imageDataUri?: string; }; }) {
    await updateGalleryImageFlow({ imageId: data.imageId, updates: data.updates });
    revalidatePath(`/companies/${data.ownerId}`);
}

export async function addCommentToImage(data: { ownerId: string; imageId: string; commentText: string; author: { id: string; name: string; profileImage: string; }; }) {
    await addCommentToImageFlow({ imageId: data.imageId, commentText: data.commentText, author: data.author });
    revalidatePath(`/companies/${data.ownerId}`);
}

export async function removeCommentFromImage(data: { ownerId: string; imageId: string; commentIndex: number; }) {
    await removeCommentFromImageFlow({ imageId: data.imageId, commentIndex: data.commentIndex });
    revalidatePath(`/companies/${data.ownerId}`);
}

// =================================
// MESSAGE ACTIONS
// =================================

export async function sendMessage(input: { conversationId: string; senderId: string; recipientId: string; text?: string; location?: { lat: number; lon: number; }; proposal?: any; }): Promise<string> {
  await sendMessageFlow(input);
  revalidatePath(`/messages/${input.conversationId}`);
  return input.conversationId;
}

export async function acceptProposal(conversationId: string, messageId: string, acceptorId: string) {
    await acceptProposalFlow({ conversationId, messageId, acceptorId });
    revalidatePath(`/messages/${conversationId}`);
    revalidatePath('/transactions');
}

// =================================
// TRANSACTION ACTIONS
// =================================

export async function createAppointmentRequest(data: {providerId: string, clientId: string, date: string, details: string, amount: number}) {
    await createAppointmentRequestFlow(data);
    revalidatePath('/transactions');
}

export async function completeWork(data: { transactionId: string; userId: string; }) {
  await completeWorkFlow(data);
  revalidatePath('/transactions');
}

export async function confirmWorkReceived(data: { transactionId: string; userId: string; rating: number; comment: string; }) {
  await confirmWorkReceivedFlow(data);
  revalidatePath('/transactions');
}

export async function payCommitment(transactionId: string) {
  // This is a placeholder as the full flow is complex.
  // In a real app, you would pass more details.
  console.log(`Paying commitment for tx: ${transactionId}`);
  revalidatePath('/transactions');
}

export async function confirmPaymentReceived(data: { transactionId: string; userId: string; fromThirdParty: boolean; }) {
  await confirmPaymentReceivedFlow(data);
  revalidatePath('/transactions');
}

export async function sendQuote(data: { transactionId: string; userId: string; breakdown: string; total: number; }) {
  await sendQuoteFlow(data);
  revalidatePath('/transactions');
}

export async function acceptAppointment(data: { transactionId: string; userId: string; }) {
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
  revalidatePath('/transactions');
}

export async function updateCart(
  userId: string,
  productId: string,
  newQuantity: number
) {
    await updateCartFlow({ userId, productId, newQuantity });
    revalidatePath('/'); // Revalidate main page to update cart icon
}


// =================================
// DELIVERY ACTIONS
// =================================

export async function retryFindDelivery(data: { transactionId: string }) {
    await findDeliveryProviderFlow(data);
    revalidatePath('/transactions');
}

export async function assignOwnDelivery(
  transactionId: string,
  providerId: string
) {
   // Placeholder for a future flow
   console.log(`Assigning own delivery for tx: ${transactionId} by provider: ${providerId}`);
   revalidatePath('/transactions');
}

export async function resolveDeliveryAsPickup(data: { transactionId: string }) {
  await resolveDeliveryAsPickupFlow(data);
  revalidatePath('/transactions');
}

// =================================
// AFFILIATION ACTIONS
// =================================
export async function requestAffiliation(providerId: string, companyId: string) {
    await requestAffiliationFlow({ providerId, companyId });
    revalidatePath('/admin');
}

export async function approveAffiliation(affiliationId: string, actorId: string) {
    await approveAffiliationFlow({ affiliationId, actorId });
    revalidatePath('/admin');
}

export async function rejectAffiliation(affiliationId: string, actorId: string) {
    await rejectAffiliationFlow({ affiliationId, actorId });
    revalidatePath('/admin');
}

export async function revokeAffiliation(affiliationId: string, actorId: string) {
    await revokeAffiliationFlow({ affiliationId, actorId });
    revalidatePath('/admin');
}

// =================================
// CAMPAIGN ACTIONS
// =================================

export async function createCampaign(userId: string, campaignData: any) {
    const input = { userId, ...campaignData };
    await createCampaignFlow(input);
    revalidatePath('/profile');
}


// =================================
// ADMIN & PAYMENT ACTIONS
// =================================

export async function toggleUserPause(userId: string, isCurrentlyPaused: boolean) {
  await updateUser(userId, { isPaused: !isCurrentlyPaused });
  revalidatePath('/admin');
}

export async function verifyCampaignPayment(
  transactionId: string,
  campaignId?: string
) {
    // In a real app, this would be a flow.
    const { getFirebaseAdmin } = await import('./firebase-server');
    const { firestore } = getFirebaseAdmin();
    const batch = firestore.batch();
    
    const txRef = firestore.collection('transactions').doc(transactionId);
    batch.update(txRef, { status: 'Pagado' });

    if(campaignId) {
        const campRef = firestore.collection('campaigns').doc(campaignId);
        batch.update(campRef, { status: 'active' });
    }
    
    await batch.commit();
    revalidatePath('/admin');
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
    
    const { getFirebaseAdmin } = await import('./firebase-server');
    const { firestore } = getFirebaseAdmin();
    const userRef = firestore.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const existingBoxes = userSnap.data()?.profileSetupData?.cashierBoxes || [];
    
    await userRef.update({ 'profileSetupData.cashierBoxes': [...existingBoxes, newBox] });
    revalidatePath('/transactions/settings/cashier');
}

export async function updateCashierBox(
  userId: string,
  boxId: string,
  updates: Partial<CashierBox>
) {
    const { getFirebaseAdmin } = await import('./firebase-server');
    const { firestore } = getFirebaseAdmin();
    const userRef = firestore.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const existingBoxes = userSnap.data()?.profileSetupData?.cashierBoxes || [];
    const updatedBoxes = existingBoxes.map((box: CashierBox) => box.id === boxId ? { ...box, ...updates } : box);

    await userRef.update({ 'profileSetupData.cashierBoxes': updatedBoxes });
    revalidatePath('/transactions/settings/cashier');
}

export async function removeCashierBox(userId: string, boxId: string) {
    const { getFirebaseAdmin } = await import('./firebase-server');
    const { firestore } = getFirebaseAdmin();
    const userRef = firestore.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const existingBoxes = userSnap.data()?.profileSetupData?.cashierBoxes || [];
    const updatedBoxes = existingBoxes.filter((box: CashierBox) => box.id !== boxId);
    await userRef.update({ 'profileSetupData.cashierBoxes': updatedBoxes });
    revalidatePath('/transactions/settings/cashier');
}

export async function regenerateCashierBoxQr(userId: string, boxId: string) {
    const newQrData = await regenerateCashierQrFlow({ userId, boxId });
    await updateCashierBox(userId, boxId, newQrData as Partial<CashierBox>);
}

export async function startQrSession(
  clientId: string,
  providerId: string,
  cashierBoxId?: string
): Promise<string> {
  const { getFirebaseAdmin } = await import('./firebase-server');
  const { firestore } = getFirebaseAdmin();
  const sessionId = `qrs-${Date.now()}`;
  const newSession: QrSession = {
    id: sessionId,
    providerId,
    clientId,
    cashierBoxId,
    status: 'pendingAmount',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participantIds: [clientId, providerId],
  };
  await firestore.collection('qr_sessions').doc(sessionId).set(newSession);
  revalidatePath('/show-qr');
  return sessionId;
}

export async function setQrSessionAmount(
  sessionId: string,
  amount: number,
  initialPayment: number,
  financedAmount: number,
  installments: number
) {
  const { getFirebaseAdmin } = await import('./firebase-server');
  const { firestore } = getFirebaseAdmin();
  await firestore.collection('qr_sessions').doc(sessionId).update({
    amount,
    initialPayment,
    financedAmount,
    installments,
    status: 'pendingClientApproval',
    updatedAt: new Date().toISOString(),
  });
  revalidatePath('/payment/approval');
}

export async function handleClientCopyAndPay(sessionId: string) {
  const { getFirebaseAdmin } = await import('./firebase-server');
  const { firestore } = getFirebaseAdmin();
  await firestore.collection('qr_sessions').doc(sessionId).update({
    status: 'awaitingPayment',
    updatedAt: new Date().toISOString(),
  });
  revalidatePath('/payment/approval');
}

export async function cancelQrSession(sessionId: string) {
  const { getFirebaseAdmin } = await import('./firebase-server');
  const { firestore } = getFirebaseAdmin();
  await firestore.collection('qr_sessions').doc(sessionId).update({
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  });
  revalidatePath('/payment/approval');
  revalidatePath('/show-qr');
}

export async function confirmMobilePayment(sessionId: string) {
  const { getFirebaseAdmin } = await import('./firebase-server');
  const { firestore } = getFirebaseAdmin();
  await firestore.collection('qr_sessions').doc(sessionId).update({
    status: 'pendingVoucherUpload',
    updatedAt: new Date().toISOString(),
  });
  revalidatePath('/show-qr');
}

export async function finalizeQrSession(sessionId: string) {
    await processDirectPaymentFlow({ sessionId });
    const { getFirebaseAdmin } = await import('./firebase-server');
    const { firestore } = getFirebaseAdmin();
    await firestore.collection('qr_sessions').doc(sessionId).update({
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });
    revalidatePath('/show-qr');
    revalidatePath('/transactions');
}

// ==================================
// SUBSCRIPTION & PROMOTION ACTIONS
// ==================================

export async function subscribeUser(
  userId: string,
  plan: string,
  amount: number
) {
    await registerSystemPayment(userId, `Suscripción: ${plan}`, amount, true);
    revalidatePath('/contacts');
    revalidatePath('/profile');
}

export async function activatePromotion(
  userId: string,
  data: { imageId: string; promotionText: string; cost: number }
) {
    await registerSystemPayment(userId, `Promoción "Emprende por Hoy": ${data.promotionText}`, data.cost, false);
    // In a real app, a flow would also update the user's promotion status
    const { getFirebaseAdmin } = await import('./firebase-server');
    const { firestore } = getFirebaseAdmin();
    const userRef = firestore.collection('users').doc(userId);
    const expires = new Date();
    expires.setDate(expires.getDate() + 1);
    await userRef.update({
        promotion: {
            text: data.promotionText,
            expires: expires.toISOString(),
        }
    });
    revalidatePath('/emprende');
}

export async function registerSystemPayment(
  userId: string,
  concept: string,
  amount: number,
  isSubscription: boolean
) {
    const { getFirebaseAdmin } = await import('./firebase-server');
    const { firestore } = getFirebaseAdmin();
    const txId = `txn-sys-${Date.now()}`;
    const newTransaction: Partial<Transaction> = {
        id: txId,
        type: 'Sistema',
        status: 'Finalizado - Pendiente de Pago',
        date: new Date().toISOString(),
        amount: amount,
        clientId: userId,
        providerId: 'corabo-admin',
        participantIds: [userId, 'corabo-admin'],
        details: {
            system: concept,
            isSubscription,
            isRenewable: true,
        },
    };
    await firestore.collection('transactions').doc(txId).set(newTransaction);
    revalidatePath('/transactions');
}
