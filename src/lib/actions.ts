
'use server';
/**
 * @fileOverview Server Actions for the Corabo application.
 * This file serves as the PRIMARY and SOLE bridge between client-side components and server-side Genkit flows.
 * All functions exported from this file are marked as server actions and will only execute on the server.
 * Client components should ONLY import from this file to interact with the backend.
 */
import { runFlow } from '@genkit-ai/core';
import type { FirebaseUserInput, User, ProfileSetupData, Transaction, Product, CartItem, GalleryImage, CreatePublicationInput, CreateProductInput, VerificationOutput, CashierBox, QrSession, TempRecipientInfo } from '@/lib/types';
import { getFirestore, doc, updateDoc, writeBatch, deleteField } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from './firebase-server';
import { defineFlow } from 'genkit';
import { z } from 'zod';


// =================================
// AUTH & USER ACTIONS
// =================================

export async function getOrCreateUser(firebaseUser: FirebaseUserInput): Promise<User | null> {
  const { firestore } = getFirebaseAdmin();
  // This is an exception where we directly call the flow because it's tightly coupled with the server-side auth process
  // and doesn't introduce client-side bundling issues in the same way.
  const getOrCreateUserFlow = (await import('@/ai/flows/auth-flow')).getOrCreateUserFlow;
  return await runFlow(getOrCreateUserFlow, firebaseUser);
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
        const autoVerifyIdWithAIFlow = (await import('@/ai/flows/verification-flow')).autoVerifyIdWithAIFlow;
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
    const createPublicationFlow = (await import('@/ai/flows/publication-flow')).createPublicationFlow;
    await runFlow(createPublicationFlow, data);
}

export async function createProduct(data: CreateProductInput) {
    const createProductFlow = (await import('@/ai/flows/publication-flow')).createProductFlow;
    await runFlow(createProductFlow, data);
}

export async function removeGalleryImage(ownerId: string, imageId: string) {
    const removeGalleryImageFlow = (await import('@/ai/flows/publication-flow')).removeGalleryImageFlow;
    await runFlow(removeGalleryImageFlow, { imageId });
}

export async function updateGalleryImage(data: { ownerId: string; imageId: string; updates: { description?: string; imageDataUri?: string; }; }) {
    const updateGalleryImageFlow = (await import('@/ai/flows/publication-flow')).updateGalleryImageFlow;
    await runFlow(updateGalleryImageFlow, { imageId: data.imageId, updates: data.updates });
}

export async function addCommentToImage(data: { ownerId: string; imageId: string; commentText: string; author: { id: string; name: string; profileImage: string; }; }) {
    const addCommentToImageFlow = (await import('@/ai/flows/publication-flow')).addCommentToImageFlow;
    await runFlow(addCommentToImageFlow, { imageId: data.imageId, commentText: data.commentText, author: data.author });
}

export async function removeCommentFromImage(data: { ownerId: string; imageId: string; commentIndex: number; }) {
    const removeCommentFromImageFlow = (await import('@/ai/flows/publication-flow')).removeCommentFromImageFlow;
    await runFlow(removeCommentFromImageFlow, { imageId: data.imageId, commentIndex: data.commentIndex });
}

// =================================
// MESSAGE ACTIONS
// =================================

export async function sendMessage(input: { conversationId: string; senderId: string; recipientId: string; text?: string; location?: { lat: number; lon: number; }; proposal?: any; }): Promise<string> {
  const sendMessageFlow = (await import('@/ai/flows/message-flow')).sendMessage;
  await runFlow(sendMessageFlow, input);
  return input.conversationId;
}

export async function acceptProposal(conversationId: string, messageId: string, acceptorId: string) {
    const acceptProposalFlow = (await import('@/ai/flows/message-flow')).acceptProposal;
    await runFlow(acceptProposalFlow, { conversationId, messageId, acceptorId });
}

export async function markConversationAsRead(conversationId: string) {
    // This is a client-side concern, but a placeholder in case backend logic is needed.
}


// =================================
// TRANSACTION ACTIONS
// =================================

export async function createAppointmentRequest(data: any) {
    const createAppointmentRequestFlow = (await import('@/ai/flows/transaction-flow')).createAppointmentRequest;
    await runFlow(createAppointmentRequestFlow, data);
}

export async function completeWork(data: {
  transactionId: string;
  userId: string;
}) {
  const completeWorkFlow = (await import('@/ai/flows/transaction-flow')).completeWork;
  await runFlow(completeWorkFlow, data);
}

export async function confirmWorkReceived(data: {
  transactionId: string;
  userId: string;
  rating: number;
  comment: string;
}) {
  const confirmWorkReceivedFlow = (await import('@/ai/flows/transaction-flow')).confirmWorkReceived;
  await runFlow(confirmWorkReceivedFlow, data);
}

export async function payCommitment(transactionId: string, userId: string, paymentDetails: { paymentMethod: string; paymentReference?: string; paymentVoucherUrl?: string;}) {
    const payCommitmentFlow = (await import('@/ai/flows/transaction-flow')).payCommitment;
    await runFlow(payCommitmentFlow, { transactionId, userId, paymentDetails });
}

export async function confirmPaymentReceived(data: {
  transactionId: string;
  userId: string;
  fromThirdParty: boolean;
}) {
  const confirmPaymentReceivedFlow = (await import('@/ai/flows/transaction-flow')).confirmPaymentReceived;
  await runFlow(confirmPaymentReceivedFlow, data);
}

export async function sendQuote(data: any) {
  const sendQuoteFlow = (await import('@/ai/flows/transaction-flow')).sendQuote;
  await runFlow(sendQuoteFlow, data);
}

export async function acceptAppointment(data: {
  transactionId: string;
  userId: string;
}) {
    const acceptAppointmentFlow = (await import('@/ai/flows/transaction-flow')).acceptAppointment;
  await runFlow(acceptAppointmentFlow, data);
}

export async function startDispute(transactionId: string) {
  const startDisputeFlow = (await import('@/ai/flows/transaction-flow')).startDispute;
  await runFlow(startDisputeFlow, transactionId);
}

export async function cancelSystemTransaction(transactionId: string) {
    const cancelSystemTransactionFlow = (await import('@/ai/flows/transaction-flow')).cancelSystemTransaction;
    await runFlow(cancelSystemTransactionFlow, { transactionId });
}

export async function downloadTransactionsPDF(transactions: Transaction[]) {
  const downloadTransactionsPDFFlow = (await import('@/ai/flows/transaction-flow')).downloadTransactionsPDF;
  return await runFlow(downloadTransactionsPDFFlow, transactions);
}

export async function checkout(
  userId: string,
  providerId: string,
  deliveryMethod: string,
  useCredicora: boolean,
  recipientInfo?: { name: string; phone: string },
  deliveryAddress?: string
) {
    const checkoutFlow = (await import('@/ai/flows/transaction-flow')).checkout;
  await runFlow(checkoutFlow, {
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
    const updateCartFlow = (await import('@/ai/flows/cart-flow')).updateCartFlow;
    await runFlow(updateCartFlow, { userId, productId, newQuantity });
}


// =================================
// DELIVERY ACTIONS
// =================================

export async function retryFindDelivery(data: { transactionId: string }) {
    const findDeliveryProviderFlow = (await import('@/ai/flows/delivery-flow')).findDeliveryProvider;
  await runFlow(findDeliveryProviderFlow, data);
}

export async function assignOwnDelivery(
  transactionId: string,
  providerId: string
) {
   // await runFlow('assignOwnDeliveryFlow', { transactionId, providerId });
}

export async function resolveDeliveryAsPickup(data: { transactionId: string }) {
  const resolveDeliveryAsPickupFlow = (await import('@/ai/flows/delivery-flow')).resolveDeliveryAsPickup;
  await runFlow(resolveDeliveryAsPickupFlow, data);
}

// =================================
// AFFILIATION ACTIONS
// =================================
export async function requestAffiliation(providerId: string, companyId: string) {
    const requestAffiliationFlow = (await import('@/ai/flows/affiliation-flow')).requestAffiliationFlow;
  await runFlow(requestAffiliationFlow, { providerId, companyId });
}

export async function approveAffiliation(affiliationId: string, actorId: string) {
    const approveAffiliationFlow = (await import('@/ai/flows/affiliation-flow')).approveAffiliationFlow;
  await runFlow(approveAffiliationFlow, { affiliationId, actorId });
}

export async function rejectAffiliation(affiliationId: string, actorId: string) {
    const rejectAffiliationFlow = (await import('@/ai/flows/affiliation-flow')).rejectAffiliationFlow;
  await runFlow(rejectAffiliationFlow, { affiliationId, actorId });
}

export async function revokeAffiliation(affiliationId: string, actorId: string) {
    const revokeAffiliationFlow = (await import('@/ai/flows/affiliation-flow')).revokeAffiliationFlow;
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
  const sendNewCampaignNotificationsFlow = (await import('@/ai/flows/notification-flow')).sendNewCampaignNotifications;
  await runFlow(sendNewCampaignNotificationsFlow, data);
}

// =================================
// CASHIER & QR ACTIONS
// =================================

export async function addCashierBox(userId: string, name: string, password: string) {
    const createCashierBoxFlow = (await import('@/ai/flows/cashier-flow')).createCashierBox;
    const newBox = await runFlow(createCashierBoxFlow, { userId, name, password });
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
    const regenerateCashierQrFlow = (await import('@/ai/flows/cashier-flow')).regenerateCashierQr;
    const newQrData = await runFlow(regenerateCashierQrFlow, { userId, boxId });
    await updateCashierBox(userId, boxId, newQrData as Partial<CashierBox>);
}

export async function startQrSession(
  clientId: string,
  providerId: string,
  cashierBoxId?: string
): Promise<string> {
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
  const { firestore } = getFirebaseAdmin();
  await firestore.collection('qr_sessions').doc(sessionId).update({
    status: 'awaitingPayment',
    updatedAt: new Date().toISOString(),
  });
}

export async function cancelQrSession(sessionId: string) {
  const { firestore } = getFirebaseAdmin();
  await firestore.collection('qr_sessions').doc(sessionId).update({
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  });
}

export async function confirmMobilePayment(sessionId: string) {
  const { firestore } = getFirebaseAdmin();
  await firestore.collection('qr_sessions').doc(sessionId).update({
    status: 'pendingVoucherUpload',
    updatedAt: new Date().toISOString(),
  });
}

export async function finalizeQrSession(sessionId: string) {
    const processDirectPaymentFlow = (await import('@/ai/flows/transaction-flow')).processDirectPayment;
    await runFlow(processDirectPaymentFlow, { sessionId });
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
  const createCampaignFlow = (await import('@/ai/flows/campaign-flow')).createCampaignFlow;
  return await runFlow(createCampaignFlow, { userId, ...data });
}
