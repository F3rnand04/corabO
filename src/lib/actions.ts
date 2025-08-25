
'use server';
/**
 * @fileOverview Server Actions for the Corabo application.
 * This file serves as the PRIMARY and SOLE bridge between client-side components and server-side Genkit flows.
 * All functions exported from this file are marked as server actions and will only execute on the server.
 * Client components should ONLY import from this file to interact with the backend.
 */
import type { FirebaseUserInput, User, ProfileSetupData, Transaction, Product, CartItem, GalleryImage, CreatePublicationInput, CreateProductInput, VerificationOutput, CashierBox, QrSession, TempRecipientInfo } from '@/lib/types';


// =================================
// AUTH & USER ACTIONS
// =================================

export async function getOrCreateUser(firebaseUser: FirebaseUserInput): Promise<User | null> {
  const { runFlow } = await import('@genkit-ai/core');
  const { getOrCreateUserFlow } = await import('@/ai/flows/auth-flow');
  return await runFlow(getOrCreateUserFlow, firebaseUser);
}

export async function updateUser(userId: string, updates: Partial<User | { 'profileSetupData.serviceRadius': number } | { 'profileSetupData.cashierBoxes': CashierBox[] }>) {
    const { runFlow } = await import('@genkit-ai/core');
    const { updateUserFlow } = await import('@/ai/flows/profile-flow');
    await runFlow(updateUserFlow, { userId, updates });
}

export async function deleteUser(userId: string) {
    const { runFlow } = await import('@genkit-ai/core');
    const { deleteUserFlow } = await import('@/ai/flows/profile-flow');
    await runFlow(deleteUserFlow, { userId });
}

export async function getPublicProfile(userId: string): Promise<Partial<User> | null> {
    const { runFlow } = await import('@genkit-ai/core');
    const { getPublicProfileFlow } = await import('@/ai/flows/profile-flow');
    return await runFlow(getPublicProfileFlow, { userId });
}

export async function getFeed(params: { limitNum: number, startAfterDocId?: string }) {
   const { runFlow } = await import('@genkit-ai/core');
   const { getFeedFlow } = await import('@/ai/flows/feed-flow');
   return await runFlow(getFeedFlow, params);
}

// =================================
// SETUP ACTIONS
// =================================

export async function completeInitialSetup(userId: string, data: any): Promise<User | null> {
    const { runFlow } = await import('@genkit-ai/core');
    const { completeInitialSetupFlow } = await import('@/ai/flows/profile-flow');
    return await runFlow(completeInitialSetupFlow, { userId, ...data });
}

export async function checkIdUniqueness(data: { idNumber: string; country: string; currentUserId: string; }): Promise<boolean> {
    const { runFlow } = await import('@genkit-ai/core');
    const { checkIdUniquenessFlow } = await import('@/ai/flows/profile-flow');
    return await runFlow(checkIdUniquenessFlow, data);
}

export async function updateFullProfile(userId: string, profileData: ProfileSetupData, userType: User['type']) {
    await updateUser(userId, { profileSetupData, type: userType });
}

export async function updateUserProfileImage(userId: string, dataUrl: string) {
    await updateUser(userId, { profileImage: dataUrl });
}

export async function toggleGps(userId: string) {
    const { runFlow } = await import('@genkit-ai/core');
    const { toggleGpsFlow } = await import('@/ai/flows/profile-flow');
    await runFlow(toggleGpsFlow, { userId });
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
    const { runFlow } = await import('@genkit-ai/core');
    const input = {
      userId: user.id,
      nameInRecord: `${user.name} ${user.lastName || ''}`.trim(),
      idInRecord: user.idNumber || '',
      documentImageUrl: user.idDocumentUrl || '',
      isCompany: user.profileSetupData?.providerType === 'company',
    };
    try {
        const { autoVerifyIdWithAIFlow } = await import('@/ai/flows/verification-flow');
        return await runFlow(autoVerifyIdWithAIFlow, input);
    } catch (e) {
        console.error("AI flow failed:", e);
        return null;
    }
}


// =================================
// PUBLICATION ACTIONS
// =================================

export async function createPublication(data: CreatePublicationInput) {
    const { runFlow } = await import('@genkit-ai/core');
    const { createPublicationFlow } = await import('@/ai/flows/publication-flow');
    await runFlow(createPublicationFlow, data);
}

export async function createProduct(data: CreateProductInput) {
    const { runFlow } = await import('@genkit-ai/core');
    const { createProductFlow } = await import('@/ai/flows/publication-flow');
    await runFlow(createProductFlow, data);
}

export async function removeGalleryImage(ownerId: string, imageId: string) {
    const { runFlow } = await import('@genkit-ai/core');
    const { removeGalleryImageFlow } = await import('@/ai/flows/publication-flow');
    await runFlow(removeGalleryImageFlow, { imageId });
}

export async function updateGalleryImage(data: { ownerId: string; imageId: string; updates: { description?: string; imageDataUri?: string; }; }) {
    const { runFlow } = await import('@genkit-ai/core');
    const { updateGalleryImageFlow } = await import('@/ai/flows/publication-flow');
    await runFlow(updateGalleryImageFlow, { imageId: data.imageId, updates: data.updates });
}

export async function addCommentToImage(data: { ownerId: string; imageId: string; commentText: string; author: { id: string; name: string; profileImage: string; }; }) {
    const { runFlow } = await import('@genkit-ai/core');
    const { addCommentToImageFlow } = await import('@/ai/flows/publication-flow');
    await runFlow(addCommentToImageFlow, { imageId: data.imageId, commentText: data.commentText, author: data.author });
}

export async function removeCommentFromImage(data: { ownerId: string; imageId: string; commentIndex: number; }) {
    const { runFlow } = await import('@genkit-ai/core');
    const { removeCommentFromImageFlow } = await import('@/ai/flows/publication-flow');
    await runFlow(removeCommentFromImageFlow, { imageId: data.imageId, commentIndex: data.commentIndex });
}

// =================================
// MESSAGE ACTIONS
// =================================

export async function sendMessage(input: { conversationId: string; senderId: string; recipientId: string; text?: string; location?: { lat: number; lon: number; }; proposal?: any; }): Promise<string> {
  const { runFlow } = await import('@genkit-ai/core');
  const { sendMessage } = await import('@/ai/flows/message-flow');
  await runFlow(sendMessage, input);
  return input.conversationId;
}

export async function acceptProposal(conversationId: string, messageId: string, acceptorId: string) {
    const { runFlow } = await import('@genkit-ai/core');
    const { acceptProposal } = await import('@/ai/flows/message-flow');
    await runFlow(acceptProposal, { conversationId, messageId, acceptorId });
}

export async function markConversationAsRead(conversationId: string) {
    // This is a client-side concern, but a placeholder in case backend logic is needed.
}


// =================================
// TRANSACTION ACTIONS
// =================================

export async function createAppointmentRequest(data: any) {
    const { runFlow } = await import('@genkit-ai/core');
    const { createAppointmentRequest } = await import('@/ai/flows/transaction-flow');
    await runFlow(createAppointmentRequest, data);
}

export async function completeWork(data: {
  transactionId: string;
  userId: string;
}) {
  const { runFlow } = await import('@genkit-ai/core');
  const { completeWork } = await import('@/ai/flows/transaction-flow');
  await runFlow(completeWork, data);
}

export async function confirmWorkReceived(data: {
  transactionId: string;
  userId: string;
  rating: number;
  comment: string;
}) {
  const { runFlow } = await import('@genkit-ai/core');
  const { confirmWorkReceived } = await import('@/ai/flows/transaction-flow');
  await runFlow(confirmWorkReceived, data);
}

export async function payCommitment(transactionId: string, userId: string, paymentDetails: { paymentMethod: string; paymentReference?: string; paymentVoucherUrl?: string;}) {
    const { runFlow } = await import('@genkit-ai/core');
    const { payCommitment } = await import('@/ai/flows/transaction-flow');
    await runFlow(payCommitment, { transactionId, userId, paymentDetails });
}

export async function confirmPaymentReceived(data: {
  transactionId: string;
  userId: string;
  fromThirdParty: boolean;
}) {
  const { runFlow } = await import('@genkit-ai/core');
  const { confirmPaymentReceived } = await import('@/ai/flows/transaction-flow');
  await runFlow(confirmPaymentReceived, data);
}

export async function sendQuote(data: any) {
  const { runFlow } = await import('@genkit-ai/core');
  const { sendQuote } = await import('@/ai/flows/transaction-flow');
  await runFlow(sendQuote, data);
}

export async function acceptAppointment(data: {
  transactionId: string;
  userId: string;
}) {
    const { runFlow } = await import('@genkit-ai/core');
    const { acceptAppointment } = await import('@/ai/flows/transaction-flow');
  await runFlow(acceptAppointment, data);
}

export async function startDispute(transactionId: string) {
  const { runFlow } = await import('@genkit-ai/core');
  const { startDispute } = await import('@/ai/flows/transaction-flow');
  await runFlow(startDispute, transactionId);
}

export async function cancelSystemTransaction(transactionId: string) {
    const { runFlow } = await import('@genkit-ai/core');
    const { cancelSystemTransaction } = await import('@/ai/flows/transaction-flow');
    await runFlow(cancelSystemTransaction, { transactionId });
}

export async function downloadTransactionsPDF(transactions: Transaction[]) {
  const { runFlow } = await import('@genkit-ai/core');
  const { downloadTransactionsPDF } = await import('@/ai/flows/transaction-flow');
  return await runFlow(downloadTransactionsPDF, transactions);
}

export async function checkout(
  userId: string,
  providerId: string,
  deliveryMethod: string,
  useCredicora: boolean,
  recipientInfo?: { name: string; phone: string },
  deliveryAddress?: string
) {
    const { runFlow } = await import('@genkit-ai/core');
    const { checkout } = await import('@/ai/flows/transaction-flow');
  await runFlow(checkout, {
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
    const { runFlow } = await import('@genkit-ai/core');
    const { updateCartFlow } = await import('@/ai/flows/cart-flow');
    await runFlow(updateCartFlow, { userId, productId, newQuantity });
}


// =================================
// DELIVERY ACTIONS
// =================================

export async function retryFindDelivery(data: { transactionId: string }) {
    const { runFlow } = await import('@genkit-ai/core');
    const { findDeliveryProvider } = await import('@/ai/flows/delivery-flow');
  await runFlow(findDeliveryProvider, data);
}

export async function assignOwnDelivery(
  transactionId: string,
  providerId: string
) {
   // await runFlow('assignOwnDeliveryFlow', { transactionId, providerId });
}

export async function resolveDeliveryAsPickup(data: { transactionId: string }) {
  const { runFlow } = await import('@genkit-ai/core');
  const { resolveDeliveryAsPickup } = await import('@/ai/flows/delivery-flow');
  await runFlow(resolveDeliveryAsPickup, data);
}

// =================================
// AFFILIATION ACTIONS
// =================================
export async function requestAffiliation(providerId: string, companyId: string) {
    const { runFlow } = await import('@genkit-ai/core');
    const { requestAffiliationFlow } = await import('@/ai/flows/affiliation-flow');
  await runFlow(requestAffiliationFlow, { providerId, companyId });
}

export async function approveAffiliation(affiliationId: string, actorId: string) {
    const { runFlow } = await import('@genkit-ai/core');
    const { approveAffiliationFlow } = await import('@/ai/flows/affiliation-flow');
  await runFlow(approveAffiliationFlow, { affiliationId, actorId });
}

export async function rejectAffiliation(affiliationId: string, actorId: string) {
    const { runFlow } = await import('@genkit-ai/core');
    const { rejectAffiliationFlow } = await import('@/ai/flows/affiliation-flow');
  await runFlow(rejectAffiliationFlow, { affiliationId, actorId });
}

export async function revokeAffiliation(affiliationId: string, actorId: string) {
    const { runFlow } = await import('@genkit-ai/core');
    const { revokeAffiliationFlow } = await import('@/ai/flows/affiliation-flow');
  await runFlow(revokeAffiliationFlow, { affiliationId, actorId });
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
  // await runFlow('verifyCampaignPaymentFlow', { transactionId, campaignId });
}

export async function sendNewCampaignNotifications(data: {
  campaignId: string;
}) {
  const { runFlow } = await import('@genkit-ai/core');
  const { sendNewCampaignNotifications } = await import('@/ai/flows/notification-flow');
  await runFlow(sendNewCampaignNotifications, data);
}

// =================================
// CASHIER & QR ACTIONS
// =================================

export async function addCashierBox(userId: string, name: string, password: string) {
    const { runFlow } = await import('@genkit-ai/core');
    const { createCashierBox } = await import('@/ai/flows/cashier-flow');
    const newBox = await runFlow(createCashierBox, { userId, name, password });
    const user = await getPublicProfile(userId);
    const existingBoxes = user?.profileSetupData?.cashierBoxes || [];
    await updateUser(userId, { 'profileSetupData.cashierBoxes': [...existingBoxes, newBox as CashierBox] });
}

export async function updateCashierBox(
  userId: string,
  boxId: string,
  updates: Partial<CashierBox>
) {
    const user = await getPublicProfile(userId);
    const existingBoxes = user?.profileSetupData?.cashierBoxes || [];
    const updatedBoxes = existingBoxes.map(box => box.id === boxId ? { ...box, ...updates } : box);
    await updateUser(userId, { 'profileSetupData.cashierBoxes': updatedBoxes });
}

export async function removeCashierBox(userId: string, boxId: string) {
    const user = await getPublicProfile(userId);
    const existingBoxes = user?.profileSetupData?.cashierBoxes || [];
    const updatedBoxes = existingBoxes.filter(box => box.id !== boxId);
    await updateUser(userId, { 'profileSetupData.cashierBoxes': updatedBoxes });
}

export async function regenerateCashierBoxQr(userId: string, boxId: string) {
    const { runFlow } = await import('@genkit-ai/core');
    const { regenerateCashierQr } = await import('@/ai/flows/cashier-flow');
    const newQrData = await runFlow(regenerateCashierQr, { userId, boxId });
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
}

export async function handleClientCopyAndPay(sessionId: string) {
  const { getFirebaseAdmin } = await import('./firebase-server');
  const { firestore } = getFirebaseAdmin();
  await firestore.collection('qr_sessions').doc(sessionId).update({
    status: 'awaitingPayment',
    updatedAt: new Date().toISOString(),
  });
}

export async function cancelQrSession(sessionId: string) {
  const { getFirebaseAdmin } = await import('./firebase-server');
  const { firestore } = getFirebaseAdmin();
  await firestore.collection('qr_sessions').doc(sessionId).update({
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  });
}

export async function confirmMobilePayment(sessionId: string) {
  const { getFirebaseAdmin } = await import('./firebase-server');
  const { firestore } = getFirebaseAdmin();
  await firestore.collection('qr_sessions').doc(sessionId).update({
    status: 'pendingVoucherUpload',
    updatedAt: new Date().toISOString(),
  });
}

export async function finalizeQrSession(sessionId: string) {
    const { runFlow } = await import('@genkit-ai/core');
    const { processDirectPayment } = await import('@/ai/flows/transaction-flow');
    await runFlow(processDirectPayment, { sessionId });
    const { getFirebaseAdmin } = await import('./firebase-server');
    const { firestore } = getFirebaseAdmin();
    await firestore.collection('qr_sessions').doc(sessionId).update({
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });
}

export async function subscribeUser(
  userId: string,
  plan: string,
  amount: number
) {
    await registerSystemPayment(userId, `Suscripción: ${plan}`, amount, true);
}

export async function activatePromotion(
  userId: string,
  data: { imageId: string; promotionText: string; cost: number }
) {
    // await runFlow('activatePromotionFlow', { userId, ...data });
}

export async function registerSystemPayment(
  userId: string,
  concept: string,
  amount: number,
  isSubscription: boolean
) {
  // await runFlow('registerSystemPaymentFlow', { userId, concept, amount, isSubscription });
}

export async function createCampaign(userId: string, data: any) {
  const { runFlow } = await import('@genkit-ai/core');
  const { createCampaignFlow } = await import('@/ai/flows/campaign-flow');
  return await runFlow(createCampaignFlow, { userId, ...data });
}
