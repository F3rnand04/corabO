'use server';
/**
 * @fileOverview Server Actions for the Corabo application.
 * This file serves as the PRIMARY and SOLE bridge between client-side components and server-side Genkit flows.
 * All functions exported from this file are marked as server actions and will only execute on the server.
 * Client components should ONLY import from this file to interact with the backend.
 * This file MUST NOT directly import from any file in `src/ai/flows`. It must use `runFlow`.
 */
import { runFlow } from '@genkit-ai/core';
import type { FirebaseUserInput, User, ProfileSetupData, Transaction, Product, CartItem, GalleryImage, CreatePublicationInput, CreateProductInput, VerificationOutput, CashierBox, QrSession, TempRecipientInfo } from '@/lib/types';


// =================================
// AUTH & USER ACTIONS
// =================================

export async function getOrCreateUser(firebaseUser: FirebaseUserInput): Promise<User | null> {
  return await runFlow('getOrCreateUserFlow', firebaseUser);
}

export async function updateUser(userId: string, updates: Partial<User | { 'profileSetupData.serviceRadius': number } | { 'profileSetupData.cashierBoxes': CashierBox[] }>) {
    await runFlow('updateUserFlow', { userId, updates });
}

export async function deleteUser(userId: string) {
    await runFlow('deleteUserFlow', { userId });
}

export async function getPublicProfile(userId: string): Promise<Partial<User> | null> {
    return await runFlow('getPublicProfileFlow', { userId });
}

export async function getFeed(params: { limitNum: number, startAfterDocId?: string }) {
   return await runFlow('getFeedFlow', params);
}

// =================================
// SETUP ACTIONS
// =================================

export async function completeInitialSetup(userId: string, data: any): Promise<User | null> {
    return await runFlow('completeInitialSetupFlow', { userId, ...data });
}

export async function checkIdUniqueness(data: { idNumber: string; country: string; currentUserId: string; }): Promise<boolean> {
    return await runFlow('checkIdUniquenessFlow', data);
}

export async function updateFullProfile(userId: string, profileData: ProfileSetupData, userType: User['type']) {
    await updateUser(userId, { profileSetupData, type: userType });
}

export async function updateUserProfileImage(userId: string, dataUrl: string) {
    await updateUser(userId, { profileImage: dataUrl });
}

export async function toggleGps(userId: string) {
    await runFlow('toggleGpsFlow', { userId });
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
        return await runFlow('autoVerifyIdWithAIFlow', input);
    } catch (e) {
        console.error("AI flow failed:", e);
        return null;
    }
}


// =================================
// PUBLICATION ACTIONS
// =================================

export async function createPublication(data: CreatePublicationInput) {
    await runFlow('createPublicationFlow', data);
}

export async function createProduct(data: CreateProductInput) {
    await runFlow('createProductFlow', data);
}

export async function removeGalleryImage(ownerId: string, imageId: string) {
    await runFlow('removeGalleryImageFlow', { imageId });
}

export async function updateGalleryImage(data: { ownerId: string; imageId: string; updates: { description?: string; imageDataUri?: string; }; }) {
    await runFlow('updateGalleryImageFlow', { imageId: data.imageId, updates: data.updates });
}

export async function addCommentToImage(data: { ownerId: string; imageId: string; commentText: string; author: { id: string; name: string; profileImage: string; }; }) {
    await runFlow('addCommentToImageFlow', { imageId: data.imageId, commentText: data.commentText, author: data.author });
}

export async function removeCommentFromImage(data: { ownerId: string; imageId: string; commentIndex: number; }) {
    await runFlow('removeCommentFromImageFlow', { imageId: data.imageId, commentIndex: data.commentIndex });
}

// =================================
// MESSAGE ACTIONS
// =================================

export async function sendMessage(input: { conversationId: string; senderId: string; recipientId: string; text?: string; location?: { lat: number; lon: number; }; proposal?: any; }): Promise<string> {
  await runFlow('sendMessageFlow', input);
  return input.conversationId;
}

export async function acceptProposal(conversationId: string, messageId: string, acceptorId: string) {
    await runFlow('acceptProposalFlow', { conversationId, messageId, acceptorId });
}

export async function markConversationAsRead(conversationId: string) {
    // This is a client-side concern, but a placeholder in case backend logic is needed.
}


// =================================
// TRANSACTION ACTIONS
// =================================

export async function createAppointmentRequest(data: any) {
    await runFlow('createAppointmentRequestFlow', data);
}

export async function completeWork(data: {
  transactionId: string;
  userId: string;
}) {
  await runFlow('completeWorkFlow', data);
}

export async function confirmWorkReceived(data: {
  transactionId: string;
  userId: string;
  rating: number;
  comment: string;
}) {
  await runFlow('confirmWorkReceivedFlow', data);
}

export async function payCommitment(transactionId: string, userId: string, paymentDetails: { paymentMethod: string; paymentReference?: string; paymentVoucherUrl?: string;}) {
  await runFlow('payCommitmentFlow', { transactionId, userId, paymentDetails });
}

export async function confirmPaymentReceived(data: {
  transactionId: string;
  userId: string;
  fromThirdParty: boolean;
}) {
  await runFlow('confirmPaymentReceivedFlow', data);
}

export async function sendQuote(data: any) {
  await runFlow('sendQuoteFlow', data);
}

export async function acceptAppointment(data: {
  transactionId: string;
  userId: string;
}) {
  await runFlow('acceptAppointmentFlow', data);
}

export async function startDispute(transactionId: string) {
  await runFlow('startDisputeFlow', transactionId);
}

export async function cancelSystemTransaction(transactionId: string) {
    await runFlow('cancelSystemTransactionFlow', { transactionId });
}

export async function downloadTransactionsPDF(transactions: Transaction[]) {
  return await runFlow('downloadTransactionsPDFFlow', transactions);
}

export async function checkout(
  userId: string,
  providerId: string,
  deliveryMethod: string,
  useCredicora: boolean,
  recipientInfo?: { name: string; phone: string },
  deliveryAddress?: string
) {
  await runFlow('checkoutFlow', {
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
    await runFlow('updateCartFlow', { userId, productId, newQuantity });
}


// =================================
// DELIVERY ACTIONS
// =================================

export async function retryFindDelivery(data: { transactionId: string }) {
  await runFlow('findDeliveryProviderFlow', data);
}

export async function assignOwnDelivery(
  transactionId: string,
  providerId: string
) {
   await runFlow('assignOwnDeliveryFlow', { transactionId, providerId });
}

export async function resolveDeliveryAsPickup(data: { transactionId: string }) {
  await runFlow('resolveDeliveryAsPickupFlow', data);
}

// =================================
// AFFILIATION ACTIONS
// =================================
export async function requestAffiliation(providerId: string, companyId: string) {
  await runFlow('requestAffiliationFlow', { providerId, companyId });
}

export async function approveAffiliation(affiliationId: string, actorId: string) {
  await runFlow('approveAffiliationFlow', { affiliationId, actorId });
}

export async function rejectAffiliation(affiliationId: string, actorId: string) {
  await runFlow('rejectAffiliationFlow', { affiliationId, actorId });
}

export async function revokeAffiliation(affiliationId: string, actorId: string) {
  await runFlow('revokeAffiliationFlow', { affiliationId, actorId });
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
  await runFlow('verifyCampaignPaymentFlow', { transactionId, campaignId });
}

export async function sendNewCampaignNotifications(data: {
  campaignId: string;
}) {
  await runFlow('sendNewCampaignNotificationsFlow', data);
}

// =================================
// CASHIER & QR ACTIONS
// =================================

export async function addCashierBox(userId: string, name: string, password: string) {
    const newBox = await runFlow('createCashierBoxFlow', { userId, name, password });
    const user = await runFlow('getPublicProfileFlow', { userId });
    const existingBoxes = user?.profileSetupData?.cashierBoxes || [];
    await runFlow('updateUserFlow', { userId, updates: { 'profileSetupData.cashierBoxes': [...existingBoxes, newBox] } });
}

export async function updateCashierBox(
  userId: string,
  boxId: string,
  updates: Partial<CashierBox>
) {
    const user = await runFlow('getPublicProfileFlow', { userId });
    const existingBoxes = user?.profileSetupData?.cashierBoxes || [];
    const updatedBoxes = existingBoxes.map(box => box.id === boxId ? { ...box, ...updates } : box);
    await runFlow('updateUserFlow', { userId, updates: { 'profileSetupData.cashierBoxes': updatedBoxes } });
}

export async function removeCashierBox(userId: string, boxId: string) {
    const user = await runFlow('getPublicProfileFlow', { userId });
    const existingBoxes = user?.profileSetupData?.cashierBoxes || [];
    const updatedBoxes = existingBoxes.filter(box => box.id !== boxId);
    await runFlow('updateUserFlow', { userId, updates: { 'profileSetupData.cashierBoxes': updatedBoxes } });
}

export async function regenerateCashierBoxQr(userId: string, boxId: string) {
    const newQrData = await runFlow('regenerateCashierQrFlow', { userId, boxId });
    await updateCashierBox(userId, boxId, newQrData);
}

export async function startQrSession(
  clientId: string,
  providerId: string,
  cashierBoxId?: string
): Promise<string> {
  return await runFlow('startQrSessionFlow', { clientId, providerId, cashierBoxId });
}

export async function setQrSessionAmount(
  sessionId: string,
  amount: number,
  initialPayment: number,
  financedAmount: number,
  installments: number
) {
  await runFlow('setQrSessionAmountFlow', { sessionId, amount, initialPayment, financedAmount, installments });
}

export async function handleClientCopyAndPay(sessionId: string) {
  await runFlow('handleClientCopyAndPayFlow', { sessionId });
}

export async function cancelQrSession(sessionId: string) {
  await runFlow('cancelQrSessionFlow', { sessionId });
}

export async function confirmMobilePayment(sessionId: string) {
  await runFlow('confirmMobilePaymentFlow', { sessionId });
}

export async function finalizeQrSession(sessionId: string) {
  await runFlow('finalizeQrSessionFlow', { sessionId });
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
    await runFlow('activatePromotionFlow', { userId, ...data });
}

export async function registerSystemPayment(
  userId: string,
  concept: string,
  amount: number,
  isSubscription: boolean
) {
  await runFlow('registerSystemPaymentFlow', { userId, concept, amount, isSubscription });
}

export async function createCampaign(userId: string, data: any) {
  return await runFlow('createCampaignFlow', { userId, ...data });
}
